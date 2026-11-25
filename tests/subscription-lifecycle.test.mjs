import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canPublishProperty,
  hasActivePremium,
  needsPropertySelection,
  publishedLimitFor,
  restorablePropertyIds,
  resolveSubscriptionStatus,
} from "../src/lib/subscriptions/expiry.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/0014_subscription_lifecycle.sql");
const cronRoute = read("../src/app/api/cron/expire-subscriptions/route.ts");
const publicData = read("../src/lib/data/public.ts");
const ownerData = read("../src/lib/data/owner.ts");
const subscriptionPage = read("../src/app/dashboard/subscription/page.tsx");
const propertiesPage = read("../src/app/dashboard/properties/page.tsx");
const publicationControls = read("../src/components/dashboard/property-publication.tsx");
const propertyActions = read("../src/app/dashboard/properties/actions.ts");
const webhookRoute = read("../src/app/api/payments/webhook/route.ts");
const enquiriesMigration = read("../supabase/migrations/0005_reviews_and_enquiries.sql");
const limits = read("../src/lib/plans/limits.ts");
const schemaHelper = read("../src/lib/supabase/schema.ts");

const now = new Date("2026-11-22T12:00:00.000Z");

test("expiry is determined from the timestamp, not a cached status string", () => {
  const expired = {
    status: "active",
    expiresAt: "2026-11-21T12:00:00.000Z",
    planCode: "premium",
  };
  const active = {
    status: "active",
    expiresAt: "2026-11-23T12:00:00.000Z",
    planCode: "premium",
  };

  assert.equal(resolveSubscriptionStatus(expired, now), "expired");
  assert.equal(resolveSubscriptionStatus(active, now), "active");
  assert.equal(resolveSubscriptionStatus({ ...active, status: "cancelled" }, now), "cancelled");
  assert.equal(hasActivePremium(expired, now), false);
  assert.equal(hasActivePremium(active, now), true);
});

test("free and expired owners can publish one property while premium can publish three", () => {
  assert.equal(
    publishedLimitFor({ isUnlimited: false, isPremium: false, freeLimit: 1, premiumLimit: 3 }),
    1,
  );
  assert.equal(
    publishedLimitFor({ isUnlimited: false, isPremium: true, freeLimit: 1, premiumLimit: 3 }),
    3,
  );
  assert.equal(
    publishedLimitFor({ isUnlimited: true, isPremium: false, freeLimit: 1, premiumLimit: 3 }),
    1_000_000,
  );

  assert.equal(
    needsPropertySelection({
      isUnlimited: false,
      isPremium: false,
      publishedCount: 3,
      publishedLimit: 1,
    }),
    true,
  );
  assert.equal(
    needsPropertySelection({
      isUnlimited: false,
      isPremium: false,
      publishedCount: 1,
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
  assert.equal(
    canPublishProperty({
      approved: false,
      isUnlimited: false,
      isPremium: true,
      publishedCount: 0,
      publishedLimit: 3,
    }),
    false,
  );
});

test("renewal restores only flagged properties up to the premium limit", () => {
  const ids = restorablePropertyIds(
    [
      {
        id: "p3",
        status: "approved",
        createdAt: "2026-03-01T00:00:00.000Z",
        isPublished: false,
        publishAfterRenewal: true,
      },
      {
        id: "p1",
        status: "approved",
        createdAt: "2026-01-01T00:00:00.000Z",
        isPublished: false,
        publishAfterRenewal: true,
      },
      {
        id: "p2",
        status: "approved",
        createdAt: "2026-02-01T00:00:00.000Z",
        isPublished: false,
        publishAfterRenewal: true,
      },
      {
        id: "active",
        status: "approved",
        createdAt: "2025-01-01T00:00:00.000Z",
        isPublished: true,
        publishAfterRenewal: false,
      },
      {
        id: "manual",
        status: "approved",
        createdAt: "2025-01-01T00:00:00.000Z",
        isPublished: false,
        publishAfterRenewal: false,
      },
      {
        id: "draft",
        status: "draft",
        createdAt: "2025-01-01T00:00:00.000Z",
        isPublished: false,
        publishAfterRenewal: true,
      },
    ],
    3,
  );

  assert.deepEqual(ids, ["p1", "p2"]);
});

test("migration adds explicit publication state and backfills approved listings", () => {
  assert.match(migration, /is_published boolean not null default false/);
  assert.match(migration, /publish_after_renewal boolean not null default false/);
  assert.match(migration, /where status = 'approved'\s+and is_published = false/);
  assert.match(migration, /create trigger enforce_published_property_limit_trigger/);
  assert.match(migration, /Published property limit reached/);
});

test("database visibility and enquiries require an explicitly published listing", () => {
  assert.match(migration, /and pr\.is_published/);
  assert.match(migration, /plan_limit_for\(pr\.owner_id, 'max_properties'\)/);
  assert.match(enquiriesMigration, /property_is_visible\(new\.property_id\)/);
  assert.match(enquiriesMigration, /and public\.property_is_visible\(property_id\)/);
});

test("central entitlement uses database time and derives selection needs", () => {
  assert.match(migration, /public\.get_owner_entitlement\(p_owner_id uuid\)/);
  assert.match(migration, /v_subscription\.expires_at > now\(\)/);
  assert.match(migration, /'needs_property_selection', \(not v_admin_bypass and not v_has_premium and v_published_count > v_published_limit\)/);
  assert.match(limits, /getOwnerEntitlement\(userId\)/);
  assert.match(limits, /subscriptions\/entitlement/);
});

test("expiry policy expires rows and unpublishes excess listings without deleting data", () => {
  assert.match(migration, /public\.apply_expired_property_policy\(p_owner_id uuid default null\)/);
  assert.match(migration, /s\.expires_at <= now\(\)/);
  assert.match(migration, /set status = 'expired'/);
  assert.match(migration, /publish_after_renewal = true/);
  assert.doesNotMatch(migration, /delete from public\.properties/);
  assert.doesNotMatch(migration, /delete from public\.property_images/);
  assert.doesNotMatch(migration, /delete from public\.reviews/);
});

test("renewal restoration is enforced by a database trigger on subscriptions", () => {
  assert.match(migration, /public\.restore_properties_after_renewal\(\)/);
  assert.match(migration, /after insert or update on public\.subscriptions/);
  assert.match(migration, /p\.publish_after_renewal/);
  assert.match(migration, /coalesce\(v_plan\.name, 'Premium'\)/);
});

test("owner selection and publication actions are server-authorized RPC calls", () => {
  assert.match(propertyActions, /supabase\.rpc\("select_expiry_property"/);
  assert.match(propertyActions, /supabase\.rpc\("set_property_published"/);
  assert.match(propertyActions, /requireOwner\(\)/);
  assert.match(migration, /grant execute on function public\.select_expiry_property/);
  assert.match(migration, /grant execute on function public\.set_property_published/);
  assert.match(migration, /revoke all on function public\.apply_expired_property_policy\(uuid\) from public/);
});

test("public reads and owner stats use the published flag when available", () => {
  const publishedFilters = publicData.match(/\.eq\("is_published", true\)/g) ?? [];
  assert.ok(publishedFilters.length >= 4);
  assert.match(schemaHelper, /error\.code !== "42703"/);
  assert.match(publicData, /hasPropertyPublicationColumn\(supabase\)/);
  assert.match(publicData, /if \(publicationReady\) query = query\.eq\("is_published", true\)/);
  assert.match(publicData, /is_published: property\.is_published \?\? true/);
  assert.match(ownerData, /isPropertyPubliclyVisible\(property\)/);
});

test("dashboard warns about expiry and offers property selection", () => {
  assert.match(subscriptionPage, /plan\.status === "expired"/);
  assert.match(subscriptionPage, /needsPropertySelectionForOwner/);
  assert.match(subscriptionPage, /plan\.daysRemaining/);
  assert.match(propertiesPage, /PropertyPublicationControls/);
  assert.match(propertiesPage, /\{plan\.publishedCount\} of \{plan\.publishedLimit\}/);
  assert.match(publicationControls, /selectPublishedPropertyAction/);
  assert.match(publicationControls, /setPropertyPublicationAction/);
});

test("scheduled expiry uses a secure, idempotent database policy and generic errors", () => {
  assert.match(cronRoute, /timingSafeEqual/);
  assert.match(cronRoute, /export async function GET/);
  assert.match(cronRoute, /export async function POST/);
  assert.match(cronRoute, /apply_expired_property_policy/);
  assert.doesNotMatch(cronRoute, /\.update\(\{ status: "expired" \}\)/);
  assert.match(cronRoute, /Expiry processing failed/);
});

test("expiry function is dropped before changing its return type", () => {
  assert.match(migration, /drop function if exists public\.expire_subscriptions\(\)/);
  assert.match(migration, /create function public\.expire_subscriptions\(\)[\s\S]*returns void/);
  assert.match(migration, /grant execute on function public\.expire_subscriptions\(\) to service_role/);
});

test("refunds are recorded without silently revoking subscriptions", () => {
  assert.match(webhookRoute, /event\.eventType === "refund\.created"/);
  assert.match(webhookRoute, /recordRefund/);
  assert.doesNotMatch(read("../supabase/migrations/0028_record_refund_details.sql"), /update public\.subscriptions/);
  assert.doesNotMatch(migration, /refund.*expired/i);
});
