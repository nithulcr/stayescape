import type { PlanLimits } from "../../types";
import type { BillingCycle, PlanRow } from "../../types/database.types";

export const BILLING_CYCLES = ["monthly", "six_month", "yearly"] as const satisfies readonly BillingCycle[];

const BILLING_DURATION_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  six_month: 6,
  yearly: 12,
};

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  six_month: "6 Months",
  yearly: "Yearly",
};

const BILLING_DURATION_LABELS: Record<BillingCycle, string> = {
  monthly: "1 month",
  six_month: "6 months",
  yearly: "12 months",
};

type DbPlanPrices = Pick<PlanRow, "price_monthly" | "price_six_month" | "price_yearly">;
type AppPlanPrices = Pick<PlanLimits, "priceMonthly" | "priceSixMonth" | "priceYearly">;
type PlanPrices = DbPlanPrices | AppPlanPrices;

const PLAN_PRICE_FIELDS: Record<BillingCycle, [keyof DbPlanPrices, keyof AppPlanPrices]> = {
  monthly: ["price_monthly", "priceMonthly"],
  six_month: ["price_six_month", "priceSixMonth"],
  yearly: ["price_yearly", "priceYearly"],
};

export function isBillingCycle(value: unknown): value is BillingCycle {
  return typeof value === "string" && BILLING_CYCLES.includes(value as BillingCycle);
}

export function getBillingDurationMonths(billingCycle: BillingCycle): number {
  return BILLING_DURATION_MONTHS[billingCycle];
}

export function getBillingCycleLabel(billingCycle: BillingCycle): string {
  return BILLING_CYCLE_LABELS[billingCycle];
}

export function getBillingDurationLabel(billingCycle: BillingCycle): string {
  return BILLING_DURATION_LABELS[billingCycle];
}

export function getPlanPriceForBillingCycle(plan: PlanPrices, billingCycle: BillingCycle): number {
  const [dbField, appField] = PLAN_PRICE_FIELDS[billingCycle];
  const source = plan as unknown as Record<string, number | string>;
  return Number(source[dbField] ?? source[appField] ?? 0);
}

export function getBillingCycleSavings(plan: PlanPrices, billingCycle: BillingCycle): number {
  if (billingCycle === "monthly") return 0;
  const months = getBillingDurationMonths(billingCycle);
  const monthlyTotal = getPlanPriceForBillingCycle(plan, "monthly") * months;
  const cyclePrice = getPlanPriceForBillingCycle(plan, billingCycle);
  return Math.max(0, monthlyTotal - cyclePrice);
}

export function addBillingCycleMonths(start: Date, billingCycle: BillingCycle): Date {
  const result = new Date(start.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + getBillingDurationMonths(billingCycle));
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, daysInTargetMonth));
  return result;
}
