export type EffectiveEntitlement = {
  plan_code: "free" | "premium";
  plan_name: string;
  has_premium: boolean;
  is_unlimited: boolean;
  max_properties: number;
  max_images_per_property: number;
  price_monthly: number | string;
  price_six_month: number | string;
  price_yearly: number | string;
  features: string[];
  expired_listing_visibility: "keep_visible" | "hide";
};

export function effectivePlanLimits(entitlement: EffectiveEntitlement, fallbacks: {
  free: {
    planCode: "free" | "premium";
    planName: string;
    maxProperties: number;
    maxImagesPerProperty: number;
    priceMonthly: number;
    priceSixMonth: number;
    priceYearly: number;
    features: string[];
    expiredListingVisibility: "keep_visible" | "hide";
  };
  premium: {
    maxImagesPerProperty: number;
  };
}) {
  const effectivePremium = entitlement.has_premium || entitlement.is_unlimited;
  const free = fallbacks.free;
  if (!effectivePremium) {
    return {
      ...free,
      features: [...free.features],
      isActive: true,
    };
  }

  return {
    planCode: entitlement.plan_code,
    planName: entitlement.plan_name,
    maxProperties: entitlement.max_properties,
    maxImagesPerProperty:
      entitlement.max_images_per_property || fallbacks.premium.maxImagesPerProperty,
    priceMonthly: Number(entitlement.price_monthly),
    priceSixMonth: Number(entitlement.price_six_month),
    priceYearly: Number(entitlement.price_yearly),
    expiredListingVisibility: entitlement.expired_listing_visibility,
    features: entitlement.features.map(String),
    isActive: true,
  };
}
