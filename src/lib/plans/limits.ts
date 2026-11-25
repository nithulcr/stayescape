import "server-only";

import {
  hasPropertyChangeRequestColumn,
  hasPropertyPublicationColumn,
} from "@/lib/supabase/schema";
import { getServerClient } from "@/lib/supabase/server";
import { getOwnerEntitlement } from "@/lib/subscriptions/entitlement";
import {
  hasActivePremium,
  needsPropertySelection,
  publishedLimitFor,
  resolveSubscriptionStatus,
} from "@/lib/subscriptions/expiry";
import type { PlanRow, SubscriptionRow } from "@/types/database.types";
import type { PlanContext, PlanLimits } from "@/types";
import { effectivePlanLimits } from "./effective-limits.ts";
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

function freeContext(limits: PlanLimits, publishedCount = 0): PlanContext {
  return {
    limits,
    isPremium: false,
    isExpired: false,
    expiresAt: null,
    billingCycle: null,
    subscriptionId: null,
    entitlement: "free",
    isUnlimited: false,
    status: "free",
    daysRemaining: null,
    publishedCount,
    publishedLimit: limits.maxProperties,
    needsPropertySelection: publishedCount > limits.maxProperties,
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
    status: "active",
    daysRemaining: null,
    publishedCount: 0,
    publishedLimit: SUPER_ADMIN_UNLIMITED,
    needsPropertySelection: false,
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

async function getPublishedPropertyCount(
  supabase: NonNullable<Awaited<ReturnType<typeof getServerClient>>>,
  userId: string,
): Promise<number> {
  const publicationReady = await hasPropertyPublicationColumn(supabase);
  const changeRequestReady = publicationReady && (await hasPropertyChangeRequestColumn(supabase));
  let query = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  if (changeRequestReady) {
    query = query
      .or("status.eq.approved,and(status.eq.pending,has_requested_changes.eq.true)")
      .eq("is_published", true);
  } else if (publicationReady) {
    query = query.eq("status", "approved").eq("is_published", true);
  } else {
    query = query.eq("status", "approved");
  }
  const { count } = await query;
  return count ?? 0;
}

export async function getPlanContextForUser(
  userId: string | null | undefined,
): Promise<PlanContext> {
  const { free, premium } = await getPlanLimits();
  if (!userId) return freeContext(free);

  const entitlement = await getOwnerEntitlement(userId);
  if (entitlement) {
    return {
      limits: effectivePlanLimits(entitlement, { free, premium }),
      isPremium: entitlement.has_premium,
      isExpired: entitlement.is_expired,
      expiresAt: entitlement.expires_at,
      billingCycle: entitlement.billing_cycle,
      subscriptionId: entitlement.subscription_id,
      entitlement: entitlement.entitlement,
      isUnlimited: entitlement.is_unlimited,
      status: entitlement.status,
      daysRemaining: entitlement.days_remaining,
      publishedCount: entitlement.published_count,
      publishedLimit: entitlement.published_limit,
      needsPropertySelection: entitlement.needs_property_selection,
    };
  }

  const supabase = await getServerClient();
  if (!supabase) return freeContext(free);

  const [profileResult, subscriptionResult, publishedResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("owner_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPublishedPropertyCount(supabase, userId),
  ]);

  if (profileResult.data?.role === "super_admin") {
    return { ...superAdminContext(premium), publishedCount: publishedResult };
  }

  const subscription = subscriptionResult.data as
    | (SubscriptionRow & { plan: PlanRow | null })
    | null;

  if (!subscription) return freeContext(free, publishedResult);

  const status = resolveSubscriptionStatus({
    status: subscription.status,
    expiresAt: subscription.expires_at,
    planCode: subscription.plan?.code ?? "free",
  });
  const isPremium = hasActivePremium({
    status: subscription.status,
    expiresAt: subscription.expires_at,
    planCode: subscription.plan?.code ?? "free",
  });
  const publishedLimit = publishedLimitFor({
    isUnlimited: false,
    isPremium,
    freeLimit: free.maxProperties,
    premiumLimit: premium.maxProperties,
  });
  const daysRemaining =
    status === "active" && subscription.expires_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.expires_at).getTime() - Date.now()) / 86_400_000,
          ),
        )
      : null;

  return {
    limits: isPremium ? toPlanLimits(subscription.plan, premium) : free,
    isPremium,
    isExpired: status === "expired" && subscription.plan?.code === "premium",
    expiresAt: subscription.expires_at,
    billingCycle: subscription.billing_cycle,
    subscriptionId: subscription.id,
    entitlement: isPremium ? "paid" : "free",
    isUnlimited: false,
    status,
    daysRemaining,
    publishedCount: publishedResult,
    publishedLimit,
    needsPropertySelection: needsPropertySelection({
      isUnlimited: false,
      isPremium,
      publishedCount: publishedResult,
      publishedLimit,
    }),
  };
}
