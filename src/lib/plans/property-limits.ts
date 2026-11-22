import type { PlanContext } from "../../types";

export function canCreateProperty(currentPropertyCount: number, plan: PlanContext): boolean {
  if (plan.isUnlimited) return true;
  return currentPropertyCount < plan.limits.maxProperties;
}

export function canPublishProperty(plan: PlanContext, approved: boolean): boolean {
  if (!approved) return false;
  if (plan.isUnlimited || plan.isPremium) return true;
  return plan.publishedCount < plan.publishedLimit;
}
