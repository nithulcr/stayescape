import assert from "node:assert/strict";
import test from "node:test";
import { preparePremiumOrder } from "../src/lib/payments/order-request.ts";

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
