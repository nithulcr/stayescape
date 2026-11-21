import type { PlanContext } from "../../types";

export function canCreateProperty(currentPropertyCount: number, plan: PlanContext): boolean {
  if (plan.isUnlimited) return true;
  return currentPropertyCount < plan.limits.maxProperties;
}
