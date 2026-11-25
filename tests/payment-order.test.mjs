import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { preparePremiumOrder } from "../src/lib/payments/order-request.ts";
import { validateRazorpayKeyPair } from "../src/lib/payments/razorpay-config.ts";

const owner = {
  userId: "owner-1",
  role: "owner",
  accountStatus: "active",
};

const premium = {
  id: "premium-plan",
  code: "premium",
  name: "Premium",
  is_active: true,
  price_monthly: 499,
  price_six_month: 2499,
  price_yearly: 4999,
};

const build = (overrides = {}) => ({
  ...owner,
  billingCycle: "monthly",
  plans: [premium],
  ...overrides,
});

test("order creation requires an authenticated user", () => {
  const result = preparePremiumOrder(build({ userId: null }));
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test("order creation rejects invalid billing cycles", () => {
  for (const billingCycle of ["weekly", "half_yearly", "", null, undefined]) {
    const result = preparePremiumOrder(build({ billingCycle }));
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  }
});

test("order creation ignores client-supplied amounts", () => {
  const result = preparePremiumOrder(build({ amount: 1, currency: "USD" }));
  assert.equal(result.ok, true);
  assert.equal(result.amount, 49900);
  assert.equal(result.currency, "INR");
});

test("order creation uses database pricing, INR, and the authenticated owner", () => {
  const cases = [
    ["monthly", 49900],
    ["six_month", 249900],
    ["yearly", 499900],
  ];
  for (const [billingCycle, amount] of cases) {
    const result = preparePremiumOrder(build({ billingCycle }));
    assert.equal(result.ok, true);
    assert.equal(result.amount, amount);
    assert.equal(result.currency, "INR");
    assert.equal(result.userId, "owner-1");
    assert.equal(result.plan.id, "premium-plan");
  }
});

test("order creation requires an active premium plan and an owner account", () => {
  const missingPlan = preparePremiumOrder(build({ plans: [] }));
  assert.equal(missingPlan.ok, false);
  assert.equal(missingPlan.status, 503);

  const inactive = preparePremiumOrder(build({ plans: [{ ...premium, is_active: false }] }));
  assert.equal(inactive.ok, false);
  assert.equal(inactive.status, 503);

  const customer = preparePremiumOrder(build({ role: "user" }));
  assert.equal(customer.ok, false);
  assert.equal(customer.status, 403);

  const suspended = preparePremiumOrder(build({ accountStatus: "suspended" }));
  assert.equal(suspended.ok, false);
  assert.equal(suspended.status, 403);
});

const liveKeyId = "rzp_live_abcdefgh12345678";
const testKeyId = "rzp_test_abcdefgh12345678";
const keySecret = "razorpay_secret_value";

test("production accepts only live Razorpay key IDs", () => {
  assert.deepEqual(
    validateRazorpayKeyPair({ keyId: liveKeyId, keySecret, isProduction: true }),
    { ok: true, keyId: liveKeyId, keySecret },
  );

  const testMode = validateRazorpayKeyPair({ keyId: testKeyId, keySecret, isProduction: true });
  assert.equal(testMode.ok, false);
  assert.equal(testMode.reason, "test_key_in_production");

  const malformed = validateRazorpayKeyPair({ keyId: "rzp_live_short-key", keySecret, isProduction: true });
  assert.equal(malformed.ok, false);
  assert.equal(malformed.reason, "invalid_key_id");
});

test("development preserves Test Mode credentials", () => {
  assert.deepEqual(
    validateRazorpayKeyPair({ keyId: testKeyId, keySecret, isProduction: false }),
    { ok: true, keyId: testKeyId, keySecret },
  );
  assert.equal(
    validateRazorpayKeyPair({ keyId: liveKeyId, keySecret, isProduction: false }).ok,
    true,
  );
});

test("missing Razorpay credentials fail safely without exposing secret values", () => {
  const results = [
    validateRazorpayKeyPair({ keyId: null, keySecret, isProduction: true }),
    validateRazorpayKeyPair({ keyId: liveKeyId, keySecret: null, isProduction: true }),
    validateRazorpayKeyPair({ keyId: testKeyId, keySecret, isProduction: true }),
    validateRazorpayKeyPair({ keyId: "not-a-key", keySecret, isProduction: true }),
  ];
  for (const result of results) {
    assert.equal(result.ok, false);
    assert.equal(JSON.stringify(result).includes(keySecret), false);
  }
});

test("payment routes use the shared validated Razorpay configuration", () => {
  const razorpay = readFileSync(new URL("../src/lib/payments/razorpay.ts", import.meta.url), "utf8");
  const createOrder = readFileSync(
    new URL("../src/app/api/payments/create-order/route.ts", import.meta.url),
    "utf8",
  );
  const webhookRoute = readFileSync(
    new URL("../src/app/api/payments/webhook/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(razorpay, /validateRazorpayKeyPair/);
  assert.match(razorpay, /if \(!razorpayConfig\.ok\) return null/);
  assert.match(razorpay, /razorpayWebhookConfigured/);
  assert.match(createOrder, /razorpayKeyId/);
  assert.doesNotMatch(createOrder, /keyId: process\.env\.NEXT_PUBLIC_RAZORPAY_KEY_ID/);
  assert.match(webhookRoute, /razorpayWebhookConfigured/);
  assert.match(webhookRoute, /Payment gateway is not configured/);
});

test("checkout reports modal dismissal", () => {
  const checkout = readFileSync(new URL("../src/components/payments/checkout-button.tsx", import.meta.url), "utf8");
  assert.match(checkout, /ondismiss/);
  assert.match(checkout, /Payment was cancelled before completion/);
});
