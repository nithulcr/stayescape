export function canUploadAnotherImage(currentCount: number, maxImages: number): boolean {
  if (!Number.isFinite(currentCount) || !Number.isFinite(maxImages)) return false;
  return Math.max(0, currentCount) < Math.max(0, maxImages);
}

export function imageLimitMessage(planName: string, maxImages: number): string {
  return `Your ${planName} plan allows ${maxImages} image${maxImages === 1 ? "" : "s"} per property.`;
}

export function effectiveImageLimit(appLimit: number, databaseLimit: unknown): number {
  if (typeof databaseLimit !== "number" || !Number.isFinite(databaseLimit)) return appLimit;
  return Math.max(0, Math.min(appLimit, databaseLimit));
}
