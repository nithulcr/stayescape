import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canPublishProperty,
  needsPropertySelectionForOwner,
  publishedLimitFor,
} from "../src/lib/subscriptions/expiry.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const lifecycleMigration = read("../supabase/migrations/0026_subscription_expiry_lifecycle.sql");
const expiryPolicy = lifecycleMigration.match(
  /create or replace function public\.apply_expired_property_policy[\s\S]*?\n\$\$;/,
)?.[0] ?? "";
const originalMigration = read("../supabase/migrations/0014_subscription_lifecycle.sql");
const paymentActivation = read("../supabase/migrations/0025_allow_retry_after_failed_payment.sql");
const cronConfig = read("../vercel.json");
const cronRoute = read("../src/app/api/cron/expire-subscriptions/route.ts");
const actions = read("../src/app/dashboard/properties/actions.ts");
const publicationControls = read("../src/components/dashboard/property-publication.tsx");
const propertiesPage = read("../src/app/dashboard/properties/page.tsx");
const newPropertyPage = read("../src/app/dashboard/properties/new/page.tsx");
const dashboardPage = read("../src/app/dashboard/page.tsx");
const subscriptionPage = read("../src/app/dashboard/subscription/page.tsx");
const limits = read("../src/lib/plans/limits.ts");
const publicData = read("../src/lib/data/public.ts");
const utils = read("../src/lib/utils/index.ts");
const databaseTypes = read("../src/types/database.types.ts");
const readme = read("../README.md");

test("one-property owners keep that property automatically and cannot publish a second slot", () => {
  assert.equal(
    publishedLimitFor({ isUnlimited: false, isPremium: false, freeLimit: 1, premiumLimit: 3 }),
    1,
  );
  assert.equal(
    needsPropertySelectionForOwner({
      isUnlimited: false,
      isPremium: false,
      propertyCount: 1,
      publishedLimit: 1,
    }),
    false,
  );
  assert.equal(
    canPublishProperty({
      approved: true,
      isUnlimited: false,
      isPremium: false,
      publishedCount: 1,
      publishedLimit: 1,
    }),
    false,
  );
});

test("selection is required from actual property count for two or three properties", () => {
  const input = {
    isUnlimited: false,
    isPremium: false,
    publishedLimit: 1,
  };

  assert.equal(needsPropertySelectionForOwner({ ...input, propertyCount: 1 }), false);
  assert.equal(needsPropertySelectionForOwner({ ...input, propertyCount: 2 }), true);
  assert.equal(needsPropertySelectionForOwner({ ...input, propertyCount: 3 }), true);
  assert.equal(
    needsPropertySelectionForOwner({ ...input, isPremium: true, propertyCount: 3 }),
    false,
  );
});

test("expiry policy unpublishes every visible property until an owner with multiple properties selects one", () => {
  assert.match(lifecycleMigration, /p\.status = 'approved'/);
  assert.match(lifecycleMigration, /p\.status = 'pending' and coalesce\(p\.has_requested_changes, false\)/);
  assert.match(expiryPolicy, /if v_property_count > 1 then/);
  assert.match(expiryPolicy, /set is_published = false,\s+publish_after_renewal = true/);
  assert.doesNotMatch(expiryPolicy, /row_number\(\) over/);
  assert.doesNotMatch(expiryPolicy, /publication_order/);
  assert.doesNotMatch(lifecycleMigration, /delete\s+from/i);
  assert.doesNotMatch(lifecycleMigration, /truncate\s+table/i);
  assert.doesNotMatch(lifecycleMigration, /drop\s+table/i);
  assert.match(originalMigration, /publish_after_renewal boolean not null default false/);
});

test("expiry policy is idempotent and scans overdue subscriptions plus excess visible listings", () => {
  assert.match(lifecycleMigration, /s\.expires_at <= now\(\)/);
  assert.match(lifecycleMigration, /union[\s\S]*having count\(\*\) > 1/);
  assert.match(lifecycleMigration, /where p_owner_id is null or candidate\.owner_id = p_owner_id/);
  assert.match(lifecycleMigration, /s\.status = 'active'/);
  assert.match(lifecycleMigration, /set status = 'expired'/);
  assert.match(lifecycleMigration, /continue when public\.has_active_premium\(v_owner\)/);
});

test("cron scheduling is configured and protected by a shared secret", () => {
  const config = JSON.parse(cronConfig);
  assert.equal(config.crons.length, 1);
  assert.equal(config.crons[0].path, "/api/cron/expire-subscriptions");
  assert.equal(config.crons[0].schedule, "0 0 * * *");
  assert.match(cronRoute, /Bearer \$\{secret\}/);
  assert.match(cronRoute, /x-cron-secret/);
  assert.match(cronRoute, /timingSafeEqual/);
  assert.match(cronRoute, /export async function GET/);
  assert.match(cronRoute, /export async function POST/);
  assert.match(cronRoute, /Expiry processing failed/);
  assert.match(readme, /schedules the expiry endpoint daily at 00:00 UTC on Vercel/);
});

test("property selection authorizes the owner, accepts any owned property, and serializes requests", () => {
  assert.match(lifecycleMigration, /auth\.uid\(\) is distinct from p_owner_id/);
  assert.match(lifecycleMigration, /perform 1 from public\.profiles[\s\S]*for update/);
  assert.match(lifecycleMigration, /select \* into v_property[\s\S]*for update/);
  assert.match(lifecycleMigration, /where p\.id = p_property_id\s+and p\.owner_id = p_owner_id/);
  assert.doesNotMatch(lifecycleMigration, /and p\.status = 'approved'\s+for update/);
  assert.match(lifecycleMigration, /v_should_publish := v_property\.status = 'approved'/);
  assert.match(lifecycleMigration, /p\.id <> p_property_id/);
  assert.match(lifecycleMigration, /grant execute on function public\.select_expiry_property/);
});

test("selection requires an explicit choice and confirmation on the client and server", () => {
  assert.match(actions, /confirmSelection/);
  assert.match(actions, /Confirm which property should be your Free property/);
  assert.match(publicationControls, /useState\(""\)/);
  assert.match(publicationControls, /name="confirmSelection"/);
  assert.match(publicationControls, /value="true"/);
  assert.match(publicationControls, /checked=\{confirmed\}/);
  assert.match(publicationControls, /disabled=\{pending \|\| !selectedId \|\| !confirmed\}/);
  assert.match(publicationControls, /Confirm Free property/);
});

test("selection shows every property card with thumbnail, location, status, and restore marker", () => {
  assert.match(publicationControls, /from "next\/image"/);
  assert.match(publicationControls, /src=\{property\.coverImage\}/);
  assert.match(publicationControls, /\{property\.location\}/);
  assert.match(publicationControls, /StatusPill status=\{property\.status\}/);
  assert.match(publicationControls, /Currently published/);
  assert.match(publicationControls, /Currently unpublished/);
  assert.match(publicationControls, /Restores on renewal/);
  assert.match(publicationControls, /Choose your Free property/);
  assert.match(propertiesPage, /canSelect: true/);
  assert.match(subscriptionPage, /canSelect: true/);
});

test("selection prompt uses actual property count on both owner pages", () => {
  assert.match(propertiesPage, /needsPropertySelectionForOwner/);
  assert.match(propertiesPage, /propertyCount: properties\.length/);
  assert.match(propertiesPage, /needsSelection=\{needsPropertySelection\}/);
  assert.match(subscriptionPage, /needsPropertySelectionForOwner/);
  assert.match(subscriptionPage, /propertyCount: properties\.length/);
  assert.match(lifecycleMigration, /v_property_count > greatest\(v_published_limit, 1\)/);
});

test("free owners attempting a second property see an upgrade prompt with back option", () => {
  assert.match(newPropertyPage, /Free allows one property/);
  assert.match(newPropertyPage, /second\s+property can only be added on Premium/);
  assert.match(newPropertyPage, /up to \{planLimits\.premium\.maxProperties\}/);
  assert.match(newPropertyPage, /Upgrade to Premium/);
  assert.match(newPropertyPage, /Cancel \/ Back/);
  assert.match(propertiesPage, /href="\/dashboard\/properties\/new" className="btn-secondary"/);
  assert.match(dashboardPage, /href="\/dashboard\/properties\/new" className="btn-secondary"/);
});

test("renewal restores eligible properties using visible-slot capacity", () => {
  assert.match(lifecycleMigration, /old\.status = 'active'[\s\S]*old\.expires_at is not distinct from new\.expires_at/);
  assert.match(lifecycleMigration, /select count\(\*\)[\s\S]*p\.is_published[\s\S]*has_requested_changes/);
  assert.match(lifecycleMigration, /restore_order <= v_available/);
  assert.match(lifecycleMigration, /is_published = true,\s+publish_after_renewal = false/);
  assert.match(originalMigration, /create trigger restore_properties_after_renewal_trigger/);
});

test("public images and premium-only content follow the owner's effective plan", () => {
  assert.match(lifecycleMigration, /create or replace function public\.public_image_limit_for_owner/);
  assert.match(lifecycleMigration, /create or replace function public\.public_allows_premium_content/);
  assert.match(lifecycleMigration, /grant execute on function public\.public_image_limit_for_owner\(uuid\) to anon/);
  assert.match(lifecycleMigration, /grant execute on function public\.public_allows_premium_content\(uuid\) to anon/);
  assert.match(publicData, /public_image_limit_for_owner/);
  assert.match(publicData, /public_allows_premium_content/);
  assert.match(publicData, /slice\(0, visibleLimit\)/);
  assert.match(publicData, /applyPublicPlanAccess/);
  assert.match(databaseTypes, /public_image_limit_for_owner: \{/);
  assert.match(databaseTypes, /public_allows_premium_content: \{/);
});

test("public visibility and counts include pending listings with requested changes", () => {
  assert.match(lifecycleMigration, /status = 'pending' and coalesce\(p\.has_requested_changes, false\)/);
  assert.match(limits, /hasPropertyChangeRequestColumn/);
  assert.match(limits, /and\(status\.eq\.pending,has_requested_changes\.eq\.true\)/);
  assert.match(publicData, /has_requested_changes/);
  assert.match(utils, /status === "pending" && Boolean\(property\.has_requested_changes\)/);
  assert.match(
    lifecycleMigration,
    /create or replace function public\.get_owner_entitlement\(p_owner_id uuid\)\s+returns jsonb/,
  );
});

test("subscription page explains expiry and shows start date, owned count, and renewal options", () => {
  assert.match(subscriptionPage, /Nothing was deleted/);
  assert.match(subscriptionPage, /properties\.length\} properties owned/);
  assert.match(subscriptionPage, /Plan started \{formatDate\(lifecycleStartsAt\)\}/);
  assert.match(subscriptionPage, /days remaining/);
  assert.match(
    subscriptionPage,
    /\{plan\.entitlement !== "admin_bypass" && \([\s\S]*Renew or extend Premium/,
  );
  assert.match(subscriptionPage, /Upgrade to Premium/);
  assert.match(subscriptionPage, /showPublishControls=\{false\}/);
});

test("payment activation updates an existing subscription instead of creating duplicates", () => {
  assert.match(paymentActivation, /update public\.subscriptions[\s\S]*insert into public\.subscriptions/);
  assert.match(paymentActivation, /activate_paid_subscription/);
  assert.match(paymentActivation, /v_has_subscription/);
});

test("super admin and admin bypass remain outside expiry enforcement", () => {
  assert.match(lifecycleMigration, /continue when public\.has_active_premium\(v_owner\)/);
  assert.match(lifecycleMigration, /v_admin_bypass/);
  assert.match(lifecycleMigration, /1000000/);
  assert.match(subscriptionPage, /entitlement === "admin_bypass"/);
  assert.match(
    subscriptionPage,
    /\{plan\.entitlement !== "admin_bypass" && \([\s\S]*Renew or extend Premium/,
  );
});
