import "server-only";

import { getServerClient } from "@/lib/supabase/server";
import type { PlanRow, SubscriptionRow } from "@/types/database.types";
import type { PlanContext, PlanLimits } from "@/types";
import {
  FALLBACK_FREE_LIMITS,
  FALLBACK_PREMIUM_LIMITS,
  SUPER_ADMIN_UNLIMITED,
} from "./plan-defaults";

export {
  FALLBACK_FREE_LIMITS,
  FALLBACK_PREMIUM_LIMITS,
  SUPER_ADMIN_UNLIMITED,
} from "./plan-defaults";

export function toPlanLimits(plan: PlanRow | null, fallback: PlanLimits): PlanLimits {
  if (!plan) return fallback;
  return {
    planCode: plan.code,
    planName: plan.name,
    maxProperties: plan.max_properties,
    maxImagesPerProperty: plan.max_images_per_property,
    priceMonthly: Number(plan.price_monthly),
    priceSixMonth: Number(plan.price_six_month),
    priceYearly: Number(plan.price_yearly),
    expiredListingVisibility: plan.expired_listing_visibility,
    features: Array.isArray(plan.features) ? plan.features.map(String) : [],
    isActive: plan.is_active,
  };
}

function freeContext(limits: PlanLimits): PlanContext {
  return {
    limits,
    isPremium: false,
    isExpired: false,
    expiresAt: null,
    billingCycle: null,
    subscriptionId: null,
    entitlement: "free",
    isUnlimited: false,
  };
}

export function superAdminContext(premium: PlanLimits): PlanContext {
  return {
    limits: {
      ...premium,
      planName: "Super Admin — All Features Enabled",
      maxProperties: SUPER_ADMIN_UNLIMITED,
      maxImagesPerProperty: SUPER_ADMIN_UNLIMITED,
      expiredListingVisibility: "keep_visible",
      features: [
        "Unlimited properties",
        "Unlimited photos within system upload limits",
        "All enhanced listing fields",
        "Featured listing control",
        "No subscription or payment required",
      ],
    },
    isPremium: true,
    isExpired: false,
    expiresAt: null,
    billingCycle: null,
    subscriptionId: null,
    entitlement: "admin_bypass",
    isUnlimited: true,
  };
}

export async function getPlans(): Promise<PlanRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as PlanRow[];
}

export async function getPlanLimits(): Promise<{
  free: PlanLimits;
  premium: PlanLimits;
}> {
  const plans = await getPlans();
  return {
    free: toPlanLimits(plans.find((plan) => plan.code === "free") ?? null, FALLBACK_FREE_LIMITS),
    premium: toPlanLimits(
      plans.find((plan) => plan.code === "premium") ?? null,
      FALLBACK_PREMIUM_LIMITS,
    ),
  };
}

export async function getPlanContextForUser(
  userId: string | null | undefined,
): Promise<PlanContext> {
  const { free, premium } = await getPlanLimits();
  if (!userId) return freeContext(free);

  const supabase = await getServerClient();
  if (!supabase) return freeContext(free);

  const [profileResult, subscriptionResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("owner_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.data?.role === "super_admin") {
    return superAdminContext(premium);
  }

  const subscription = subscriptionResult.data as
    | (SubscriptionRow & { plan: PlanRow | null })
    | null;

  if (!subscription) return freeContext(free);

  const expiresAt = subscription.expires_at;
  const expired = !expiresAt || new Date(expiresAt).getTime() <= Date.now();
  const isPremium = !expired && subscription.plan?.code === "premium";

  return {
    limits: isPremium ? toPlanLimits(subscription.plan, premium) : free,
    isPremium,
    isExpired: expired && subscription.plan?.code === "premium",
    expiresAt,
    billingCycle: subscription.billing_cycle,
    subscriptionId: subscription.id,
    entitlement: isPremium ? "paid" : "free",
    isUnlimited: false,
  };
}
