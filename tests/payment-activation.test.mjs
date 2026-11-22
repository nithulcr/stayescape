import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getBillingDurationMonths } from "../src/lib/plans/billing-cycle.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/0013_payment_security.sql");
const initial = read("../supabase/migrations/0001_initial_schema.sql");
const verifyRoute = read("../src/app/api/payments/verify/route.ts");
const webhookRoute = read("../src/app/api/payments/webhook/route.ts");
const checkout = read("../src/components/payments/checkout-button.tsx");

test("activation duration comes only from the central billing-cycle helper", () => {
  assert.equal(getBillingDurationMonths("monthly"), 1);
  assert.equal(getBillingDurationMonths("six_month"), 6);
  assert.equal(getBillingDurationMonths("yearly"), 12);
  assert.match(verifyRoute, /getBillingDurationMonths\(payment\.billing_cycle\)/);
  assert.match(webhookRoute, /getBillingDurationMonths\(payment\.billing_cycle\)/);
  assert.doesNotMatch(verifyRoute, /addBillingCycleMonths/);
  assert.doesNotMatch(webhookRoute, /addBillingCycleMonths/);
  assert.match(migration, /make_interval\(months => p_duration_months\)/);
});

test("activation locks payment and owner rows and validates database amounts", () => {
  assert.match(migration, /where id = p_payment_id for update/);
  assert.match(migration, /where p\.id = v_payment\.user_id for update/);
  assert.match(migration, /v_payment\.status not in \('pending', 'failed'\)/);
  assert.match(migration, /upper\(btrim\(v_payment\.currency\)\) <> 'INR'/);
  assert.match(verifyRoute, /expectedAmount: payment\.amount/);
  assert.match(webhookRoute, /expectedAmount: payment\.amount/);
});

test("duplicate activation cannot create multiple subscriptions", () => {
  assert.match(migration, /if v_payment\.status = 'success' then/);
  assert.match(migration, /return jsonb_build_object\(\s*'ok', true,\s*'message', 'Payment already recorded\.'/);
  assert.match(migration, /if v_has_subscription then/);
  assert.match(initial, /create unique index subscriptions_one_active_per_owner/);
  assert.match(initial, /razorpay_order_id text not null unique/);
  assert.match(initial, /razorpay_payment_id text unique/);
});

test("concurrent verification and webhook processing are serialized", () => {
  assert.match(migration, /for update/);
  assert.match(migration, /on conflict \(event_id\) do nothing/);
  assert.match(migration, /grant execute on function public\.activate_paid_subscription/);
});

test("existing active subscriptions are renewed instead of reset", () => {
  assert.match(migration, /greatest\(now\(\), coalesce\(v_subscription\.expires_at, now\(\)\)\)/);
  assert.match(migration, /auto_renew = false/);
});

test("client code never contains the Razorpay secret", () => {
  assert.doesNotMatch(checkout, /RAZORPAY_KEY_SECRET/);
  assert.doesNotMatch(checkout, /key_secret/);
});
