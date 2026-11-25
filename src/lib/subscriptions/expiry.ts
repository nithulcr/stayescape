export type SubscriptionStatusInput = {
  status: "active" | "expired" | "cancelled";
  expiresAt: string | null;
  planCode: "free" | "premium";
};

export type PublicationLimitInput = {
  isUnlimited: boolean;
  isPremium: boolean;
  publishedCount: number;
  publishedLimit: number;
};

export type RestorableProperty = {
  id: string;
  status: string;
  createdAt: string;
  isPublished: boolean;
  publishAfterRenewal: boolean;
};

export function resolveSubscriptionStatus(
  input: SubscriptionStatusInput,
  now: Date = new Date(),
): "active" | "expired" | "cancelled" {
  if (input.status === "cancelled") return "cancelled";
  if (input.status === "expired") return "expired";
  if (input.status !== "active") return "expired";
  if (!input.expiresAt) return "active";
  return new Date(input.expiresAt).getTime() <= now.getTime() ? "expired" : "active";
}

export function hasActivePremium(
  input: SubscriptionStatusInput,
  now: Date = new Date(),
): boolean {
  return input.planCode === "premium" && resolveSubscriptionStatus(input, now) === "active";
}

export function publishedLimitFor(input: {
  isUnlimited: boolean;
  isPremium: boolean;
  freeLimit: number;
  premiumLimit: number;
}): number {
  if (input.isUnlimited) return 1_000_000;
  return input.isPremium ? input.premiumLimit : input.freeLimit;
}

export function needsPropertySelection(input: PublicationLimitInput): boolean {
  if (input.isUnlimited || input.isPremium) return false;
  return input.publishedCount > input.publishedLimit;
}

export function needsPropertySelectionForOwner(input: {
  isUnlimited: boolean;
  isPremium: boolean;
  propertyCount: number;
  publishedLimit: number;
}): boolean {
  if (input.isUnlimited || input.isPremium) return false;
  return input.propertyCount > Math.max(1, input.publishedLimit);
}

export function canPublishProperty(
  input: PublicationLimitInput & { approved: boolean },
): boolean {
  if (!input.approved) return false;
  if (input.isUnlimited || input.isPremium) return true;
  return input.publishedCount < input.publishedLimit;
}

export function restorablePropertyIds(
  properties: RestorableProperty[],
  publishedLimit: number,
): string[] {
  const approved = properties.filter((property) => property.status === "approved");
  const activeCount = approved.filter((property) => property.isPublished).length;
  const available = Math.max(0, publishedLimit - activeCount);

  return approved
    .filter((property) => !property.isPublished && property.publishAfterRenewal)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
    .slice(0, available)
    .map((property) => property.id);
}
