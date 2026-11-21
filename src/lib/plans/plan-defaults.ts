import type { PlanLimits } from "../../types";

export const SUPER_ADMIN_UNLIMITED = 1_000_000;

export const FALLBACK_FREE_LIMITS: PlanLimits = {
  planCode: "free",
  planName: "Free",
  maxProperties: 1,
  maxImagesPerProperty: 1,
  priceMonthly: 0,
  priceSixMonth: 0,
  priceYearly: 0,
  expiredListingVisibility: "keep_visible",
  features: ["1 property", "1 photo", "Basic listing details"],
  isActive: true,
};

export const FALLBACK_PREMIUM_LIMITS: PlanLimits = {
  planCode: "premium",
  planName: "Premium",
  maxProperties: 3,
  maxImagesPerProperty: 5,
  priceMonthly: 499,
  priceSixMonth: 2499,
  priceYearly: 4999,
  expiredListingVisibility: "keep_visible",
  features: ["3 properties", "5 photos per property", "Full listing details"],
  isActive: true,
};
