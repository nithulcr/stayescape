import assert from "node:assert/strict";
import test from "node:test";
import { canCreateProperty } from "../src/lib/plans/property-limits.ts";
import {
  FALLBACK_FREE_LIMITS,
  FALLBACK_PREMIUM_LIMITS,
  SUPER_ADMIN_UNLIMITED,
} from "../src/lib/plans/plan-defaults.ts";

function context(limits, overrides = {}) {
  return {
    limits,
    isPremium: limits.planCode === "premium",
    isExpired: false,
    expiresAt: null,
    billingCycle: null,
    subscriptionId: null,
    entitlement: limits.planCode === "premium" ? "paid" : "free",
    isUnlimited: false,
    ...overrides,
  };
}

function createUntilRefused(plan) {
  let count = 0;
  while (canCreateProperty(count, plan)) count += 1;
  return count;
}

test("free owner can create one property and cannot create a second", () => {
  const free = context(FALLBACK_FREE_LIMITS);
  assert.equal(canCreateProperty(0, free), true);
  assert.equal(canCreateProperty(1, free), false);
  assert.equal(createUntilRefused(free), 1);
});

test("premium owner can create three properties and cannot create a fourth", () => {
  const premium = context(FALLBACK_PREMIUM_LIMITS);
  assert.equal(canCreateProperty(2, premium), true);
  assert.equal(canCreateProperty(3, premium), false);
  assert.equal(createUntilRefused(premium), 3);
});

test("an active premium subscription keeps working for its owner", () => {
  const renewed = context(
    { ...FALLBACK_PREMIUM_LIMITS, planCode: "premium" },
    {
      isPremium: true,
      entitlement: "paid",
      billingCycle: "six_month",
      subscriptionId: "11111111-1111-4111-8111-111111111111",
      expiresAt: "2027-05-15T00:00:00.000Z",
    },
  );
  assert.equal(canCreateProperty(2, renewed), true);
  assert.equal(canCreateProperty(3, renewed), false);
  assert.equal(renewed.billingCycle, "six_month");
});

test("super admin bypasses property limits", () => {
  const unlimited = context(
    { ...FALLBACK_PREMIUM_LIMITS, maxProperties: SUPER_ADMIN_UNLIMITED },
    { isPremium: true, entitlement: "admin_bypass", isUnlimited: true },
  );
  assert.equal(canCreateProperty(3, unlimited), true);
  assert.equal(canCreateProperty(10_000, unlimited), true);
});
