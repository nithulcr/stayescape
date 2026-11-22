import { getPlanPriceForBillingCycle, isBillingCycle } from "../plans/billing-cycle.ts";
import type { BillingCycle, PlanRow } from "../../types/database.types";

export type PremiumOrderInput = {
  userId: string | null | undefined;
  billingCycle: unknown;
  plans: readonly PlanRow[];
  role?: string | null;
  accountStatus?: string | null;
};

export type PremiumOrderResult =
  | {
      ok: true;
      userId: string;
      plan: PlanRow;
      billingCycle: BillingCycle;
      amount: number;
      currency: "INR";
    }
  | { ok: false; status: number; message: string };

export function preparePremiumOrder(input: PremiumOrderInput): PremiumOrderResult {
  if (!input.userId) return { ok: false, status: 401, message: "Sign in to continue." };
  if (input.accountStatus !== "active") {
    return { ok: false, status: 403, message: "This account cannot purchase Premium." };
  }
  if (!["owner", "admin", "super_admin"].includes(input.role ?? "")) {
    return { ok: false, status: 403, message: "Only owners can purchase Premium." };
  }
  if (!isBillingCycle(input.billingCycle)) {
    return { ok: false, status: 400, message: "Choose a valid billing cycle." };
  }

  const premium = input.plans.find((plan) => plan.code === "premium" && plan.is_active);
  if (!premium) {
    return { ok: false, status: 503, message: "Premium plan is not available yet." };
  }

  const amount = Math.round(getPlanPriceForBillingCycle(premium, input.billingCycle) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { ok: false, status: 503, message: "Plan price is not configured." };
  }

  return {
    ok: true,
    userId: input.userId,
    plan: premium,
    billingCycle: input.billingCycle,
    amount,
    currency: "INR",
  };
}
