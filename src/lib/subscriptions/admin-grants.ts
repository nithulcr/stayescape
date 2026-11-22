import { getBillingDurationMonths, isBillingCycle } from "../plans/billing-cycle.ts";
import type { BillingCycle } from "../../types/database.types.ts";

export const ADMIN_GRANT_REASONS = [
  "Promotional access",
  "Customer support",
  "Partner agreement",
  "Testing",
  "Other",
] as const;

export type AdminGrantReason = (typeof ADMIN_GRANT_REASONS)[number];

export type AdminPremiumDuration = {
  billingCycle: BillingCycle;
  durationMonths: number;
  custom: boolean;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function resolveAdminPremiumDuration(
  billingCycle: string | null,
  customMonths: string | null,
): ValidationResult<AdminPremiumDuration> {
  if (billingCycle === "custom") {
    const durationMonths = Number(customMonths);
    if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) {
      return { ok: false, message: "Custom duration must be between 1 and 120 months." };
    }
    return { ok: true, value: { billingCycle: "monthly", durationMonths, custom: true } };
  }

  if (!isBillingCycle(billingCycle)) {
    return { ok: false, message: "Choose a valid duration." };
  }

  return {
    ok: true,
    value: {
      billingCycle,
      durationMonths: getBillingDurationMonths(billingCycle),
      custom: false,
    },
  };
}

export function resolveAdminGrantReason(
  reason: string | null,
  otherReason: string | null,
): ValidationResult<string> {
  if (!reason || !ADMIN_GRANT_REASONS.includes(reason as AdminGrantReason)) {
    return { ok: false, message: "Choose a reason." };
  }

  if (reason !== "Other") return { ok: true, value: reason };

  const detail = otherReason?.trim() ?? "";
  if (detail.length < 3 || detail.length > 200) {
    return { ok: false, message: "Enter the reason in 3 to 200 characters." };
  }
  return { ok: true, value: detail };
}

export function parseAdminStartDate(
  value: string | null,
  now: Date = new Date(),
): ValidationResult<string> {
  if (!value?.trim()) return { ok: true, value: now.toISOString() };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, message: "Enter a valid start date." };
  }

  const earliest = now.getTime() - 365 * 24 * 60 * 60 * 1000;
  const latest = now.getTime() + 5 * 60 * 1000;
  if (parsed.getTime() < earliest || parsed.getTime() > latest) {
    return { ok: false, message: "Start date must be recent or current." };
  }

  return { ok: true, value: parsed.toISOString() };
}

export function isActivePremiumSubscription(
  subscription: {
    status: string;
    planCode: string | null;
    expiresAt: string | null;
  } | null,
  now: Date = new Date(),
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active" || subscription.planCode !== "premium") return false;
  if (!subscription.expiresAt) return true;
  return new Date(subscription.expiresAt).getTime() > now.getTime();
}

export function getAdminPlanLabel(
  planName: string | null,
  source: string | null,
  isPremium: boolean,
): string {
  if (isPremium && source === "admin_grant") return "Premium (Admin Grant)";
  if (isPremium) return "Premium";
  return planName ?? "Free";
}
