import type { SubscriptionSource, UserRole } from "../../types/database.types.ts";
import { hasActivePremium, resolveSubscriptionStatus } from "./expiry.ts";

export type EffectivePlanInput = {
  role: UserRole | string | null;
  planCode: string | null;
  status: string | null;
  expiresAt: string | null;
  source: SubscriptionSource | string | null;
};

export type EffectivePlan = {
  label: string;
  isPremium: boolean;
  isAdminAccess: boolean;
  isSuperAdmin: boolean;
  effectiveStatus: "active" | "expired" | "cancelled" | "none";
};

function normalizedStatus(status: string | null): "active" | "expired" | "cancelled" {
  return status === "active" || status === "expired" || status === "cancelled" ? status : "expired";
}

function normalizedPlanCode(planCode: string | null): "free" | "premium" {
  return planCode === "premium" ? "premium" : "free";
}

export function getEffectivePlan(input: EffectivePlanInput, now: Date = new Date()): EffectivePlan {
  if (input.role === "super_admin") {
    return {
      label: "Super Admin",
      isPremium: false,
      isAdminAccess: true,
      isSuperAdmin: true,
      effectiveStatus: "none",
    };
  }

  if (input.role === "admin") {
    return {
      label: "Admin Access",
      isPremium: false,
      isAdminAccess: true,
      isSuperAdmin: false,
      effectiveStatus: "none",
    };
  }

  if (!input.status) {
    return {
      label: "Free",
      isPremium: false,
      isAdminAccess: false,
      isSuperAdmin: false,
      effectiveStatus: "none",
    };
  }

  const subscription = {
    status: normalizedStatus(input.status),
    planCode: normalizedPlanCode(input.planCode),
    expiresAt: input.expiresAt,
  };
  const effectiveStatus = resolveSubscriptionStatus(subscription, now);
  const isPremium = hasActivePremium(subscription, now);

  return {
    label: isPremium
      ? input.source === "admin_grant"
        ? "Premium (Admin Grant)"
        : input.source === "manual"
          ? "Premium (Manual Payment)"
          : "Premium"
      : "Free",
    isPremium,
    isAdminAccess: false,
    isSuperAdmin: false,
    effectiveStatus,
  };
}
