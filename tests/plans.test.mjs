import assert from "node:assert/strict";
import test from "node:test";
import {
  BILLING_CYCLES,
  addBillingCycleMonths,
  getBillingCycleLabel,
  getBillingCycleSavings,
  getBillingDurationLabel,
  getBillingDurationMonths,
  getPlanPriceForBillingCycle,
  isBillingCycle,
} from "../src/lib/plans/billing-cycle.ts";
import {
  FALLBACK_FREE_LIMITS,
  FALLBACK_PREMIUM_LIMITS,
} from "../src/lib/plans/plan-defaults.ts";

const premiumPlan = {
  price_monthly: FALLBACK_PREMIUM_LIMITS.priceMonthly,
  price_six_month: FALLBACK_PREMIUM_LIMITS.priceSixMonth,
  price_yearly: FALLBACK_PREMIUM_LIMITS.priceYearly,
};

test("plan catalog prices and property limits", () => {
  assert.equal(FALLBACK_FREE_LIMITS.maxProperties, 1);
  assert.equal(FALLBACK_FREE_LIMITS.priceMonthly, 0);
  assert.equal(FALLBACK_PREMIUM_LIMITS.maxProperties, 3);
  assert.equal(FALLBACK_PREMIUM_LIMITS.priceMonthly, 499);
  assert.equal(FALLBACK_PREMIUM_LIMITS.priceSixMonth, 2499);
  assert.equal(FALLBACK_PREMIUM_LIMITS.priceYearly, 4999);
  assert.ok(FALLBACK_PREMIUM_LIMITS.features.some((feature) => feature.includes("3 properties")));
});

test("all three billing cycles are registered and validated", () => {
  assert.deepEqual([...BILLING_CYCLES], ["monthly", "six_month", "yearly"]);
  assert.equal(isBillingCycle("monthly"), true);
  assert.equal(isBillingCycle("six_month"), true);
  assert.equal(isBillingCycle("yearly"), true);
  assert.equal(isBillingCycle("half_yearly"), false);
});

test("billing durations use the central mapping", () => {
  assert.equal(getBillingDurationMonths("monthly"), 1);
  assert.equal(getBillingDurationMonths("six_month"), 6);
  assert.equal(getBillingDurationMonths("yearly"), 12);
  assert.equal(getBillingDurationLabel("monthly"), "1 month");
  assert.equal(getBillingDurationLabel("six_month"), "6 months");
  assert.equal(getBillingDurationLabel("yearly"), "12 months");
  assert.equal(getBillingCycleLabel("six_month"), "6 Months");
});

test("price is selected from the plan by billing cycle", () => {
  assert.equal(getPlanPriceForBillingCycle(premiumPlan, "monthly"), 499);
  assert.equal(getPlanPriceForBillingCycle(premiumPlan, "six_month"), 2499);
  assert.equal(getPlanPriceForBillingCycle(premiumPlan, "yearly"), 4999);
  assert.equal(getPlanPriceForBillingCycle(FALLBACK_PREMIUM_LIMITS, "monthly"), 499);
  assert.equal(getPlanPriceForBillingCycle(FALLBACK_PREMIUM_LIMITS, "six_month"), 2499);
  assert.equal(getPlanPriceForBillingCycle(FALLBACK_PREMIUM_LIMITS, "yearly"), 4999);
});

test("savings are calculated against the monthly price", () => {
  assert.equal(getBillingCycleSavings(premiumPlan, "monthly"), 0);
  assert.equal(getBillingCycleSavings(premiumPlan, "six_month"), 495);
  assert.equal(getBillingCycleSavings(premiumPlan, "yearly"), 989);
  assert.equal(getBillingCycleSavings(FALLBACK_PREMIUM_LIMITS, "six_month"), 495);
  assert.equal(getBillingCycleSavings(FALLBACK_PREMIUM_LIMITS, "yearly"), 989);
});

test("subscription expiry uses exact calendar months with month-end clamping", () => {
  const start = new Date("2026-01-15T10:30:00.000Z");
  assert.equal(addBillingCycleMonths(start, "monthly").toISOString(), "2026-02-15T10:30:00.000Z");
  assert.equal(addBillingCycleMonths(start, "six_month").toISOString(), "2026-07-15T10:30:00.000Z");
  assert.equal(addBillingCycleMonths(start, "yearly").toISOString(), "2027-01-15T10:30:00.000Z");

  assert.equal(addBillingCycleMonths(new Date("2026-01-31T00:00:00.000Z"), "monthly").toISOString(), "2026-02-28T00:00:00.000Z");
  assert.equal(addBillingCycleMonths(new Date("2024-01-31T00:00:00.000Z"), "monthly").toISOString(), "2024-02-29T00:00:00.000Z");
  assert.equal(addBillingCycleMonths(new Date("2026-08-31T00:00:00.000Z"), "six_month").toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(start.toISOString(), "2026-01-15T10:30:00.000Z");
});
