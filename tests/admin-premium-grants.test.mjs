import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getAdminPlanLabel,
  isActivePremiumSubscription,
  parseAdminStartDate,
  resolveAdminGrantReason,
  resolveAdminPremiumDuration,
} from "../src/lib/subscriptions/admin-grants.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/0015_admin_premium_grants.sql");
const actions = read("../src/app/admin/actions.ts");
const data = read("../src/lib/data/admin.ts");
const usersPage = read("../src/app/admin/users/page.tsx");
const subscriptionsPage = read("../src/app/admin/subscriptions/page.tsx");
const manager = read("../src/components/admin/premium-subscription-manager.tsx");
const types = read("../src/types/database.types.ts");

const now = new Date("2026-11-22T12:00:00.000Z");

test("duration validation uses billing cycles and bounded custom grants", () => {
  assert.deepEqual(resolveAdminPremiumDuration("yearly", null), {
    ok: true,
    value: { billingCycle: "yearly", durationMonths: 12, custom: false },
  });
  assert.deepEqual(resolveAdminPremiumDuration("custom", "7"), {
    ok: true,
    value: { billingCycle: "monthly", durationMonths: 7, custom: true },
  });
  assert.equal(resolveAdminPremiumDuration("custom", "0").ok, false);
  assert.equal(resolveAdminPremiumDuration("custom", "121").ok, false);
  assert.equal(resolveAdminPremiumDuration("weekly", null).ok, false);
});

test("reason, start date, and status validation are explicit", () => {
  assert.deepEqual(resolveAdminGrantReason("Other", "VIP migration"), {
    ok: true,
    value: "VIP migration",
  });
  assert.equal(resolveAdminGrantReason("Other", "x").ok, false);
  assert.equal(resolveAdminGrantReason("Unknown", null).ok, false);
  assert.equal(parseAdminStartDate(null, now).value, now.toISOString());
  assert.equal(parseAdminStartDate("2026-11-22T11:59:00.000Z", now).ok, true);
  assert.equal(parseAdminStartDate("2026-12-01T12:00:00.000Z", now).ok, false);
  assert.equal(parseAdminStartDate("2025-01-01T12:00:00.000Z", now).ok, false);
  assert.equal(
    isActivePremiumSubscription(
      { status: "active", planCode: "premium", expiresAt: "2026-11-23T12:00:00.000Z" },
      now,
    ),
    true,
  );
  assert.equal(
    isActivePremiumSubscription(
      { status: "active", planCode: "premium", expiresAt: "2026-11-21T12:00:00.000Z" },
      now,
    ),
    false,
  );
  assert.equal(getAdminPlanLabel("Premium", "admin_grant", true), "Premium (Admin Grant)");
  assert.equal(getAdminPlanLabel(null, null, false), "Free");
});

test("migration records manual grants without creating payment records", () => {
  assert.match(migration, /source text not null default 'razorpay' check \(source in \('razorpay', 'admin_grant'\)\)/);
  assert.match(migration, /granted_by uuid references public\.profiles\(id\)/);
  assert.match(migration, /grant_duration_months integer/);
  assert.match(migration, /admin_grant_metadata_required/);
  assert.match(migration, /'admin_grant'/);
  assert.match(migration, /auto_renew.*false/s);
  assert.doesNotMatch(migration, /insert into public\.payments/i);
  assert.doesNotMatch(migration, /update public\.payments/i);
  assert.doesNotMatch(migration, /delete from public\.payments/i);
});

test("database RPCs authorize super admins and bind the actor identity", () => {
  assert.match(migration, /create or replace function public\.assert_admin_subscription_actor/);
  assert.match(migration, /public\.is_service_role\(\) or public\.is_super_admin\(\)/);
  assert.match(migration, /auth\.uid\(\) <> p_actor_id/);
  assert.match(migration, /create or replace function public\.admin_grant_premium/);
  assert.match(migration, /create or replace function public\.admin_extend_premium/);
  assert.match(migration, /create or replace function public\.admin_revoke_premium/);
  assert.match(migration, /perform public\.assert_admin_subscription_actor/);
  assert.match(migration, /revoke all on function public\.admin_grant_premium/);
  assert.match(migration, /grant execute on function public\.admin_grant_premium/);
});

test("migration uses database time, audits changes, and preserves owned data", () => {
  assert.match(migration, /make_interval\(months => p_duration_months\)/);
  assert.match(migration, /greatest\(p_start_at, now\(\)\)/);
  assert.match(migration, /greatest\(now\(\), coalesce\(v_subscription\.expires_at, now\(\)\)\)/);
  assert.match(migration, /public\.record_admin_subscription_audit/);
  assert.match(migration, /'subscription\.admin_granted'/);
  assert.match(migration, /'subscription\.admin_extended'/);
  assert.match(migration, /'subscription\.admin_revoked'/);
  assert.match(migration, /perform public\.apply_expired_property_policy\(p_owner_id\)/);
  assert.match(migration, /status = 'cancelled'/);
  assert.doesNotMatch(migration, /delete from public\.properties/i);
  assert.doesNotMatch(migration, /delete from public\.property_images/i);
  assert.doesNotMatch(migration, /delete from public\.reviews/i);
});

test("server actions require super admin and call authorized RPCs", () => {
  const required = actions.match(/requireSuperAdmin\(\)/g) ?? [];
  assert.ok(required.length >= 3);
  assert.match(actions, /export async function grantPremiumAction/);
  assert.match(actions, /export async function extendPremiumAction/);
  assert.match(actions, /export async function revokePremiumAction/);
  assert.match(actions, /supabase\.rpc\("admin_grant_premium"/);
  assert.match(actions, /supabase\.rpc\("admin_extend_premium"/);
  assert.match(actions, /supabase\.rpc\("admin_revoke_premium"/);
  assert.match(actions, /resolveAdminPremiumDuration/);
  assert.match(actions, /resolveAdminGrantReason/);
  assert.match(actions, /parseAdminStartDate/);
  assert.match(actions, /p_actor_id: user\.id/);
});

test("admin pages expose source and manual controls only to super admins", () => {
  assert.match(data, /subscription_source: SubscriptionSource \| null/);
  assert.match(usersPage, /canManageRoles && manageableUserMap\.has\(user\.id\)/);
  assert.match(usersPage, /PremiumSubscriptionManager/);
  assert.match(subscriptionsPage, /isAdminGrant \? "Admin Grant" : "Razorpay"/);
  assert.match(subscriptionsPage, /grant_duration_months/);
  assert.match(subscriptionsPage, /grant_reason/);
  assert.match(manager, /This will grant Premium access without creating a payment\./);
  assert.match(manager, /This will extend Premium access without creating a payment\./);
  assert.match(manager, /Payment and property records are not deleted\./);
  assert.match(manager, /Type REVOKE to confirm/);
  assert.match(types, /export type SubscriptionSource = "razorpay" \| "admin_grant"/);
  assert.match(types, /admin_grant_premium/);
  assert.match(types, /admin_extend_premium/);
  assert.match(types, /admin_revoke_premium/);
});
