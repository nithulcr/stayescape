import type { ManualRequestStatus } from "@/types/database.types";

const paymentReferencePattern = /^[A-Z0-9][A-Z0-9/_-]{5,63}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const manualRequestStatuses: ManualRequestStatus[] = [
  "pending",
  "payment_submitted",
  "under_verification",
  "approved",
  "rejected",
];

export function normalizePaymentReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return paymentReferencePattern.test(normalized) ? normalized : null;
}

export function isManualRequestStatus(value: unknown): value is ManualRequestStatus {
  return typeof value === "string" && manualRequestStatuses.includes(value as ManualRequestStatus);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function manualProofPath(userId: string, requestId: string, fileName: string): string {
  return `${userId}/${requestId}/${fileName}`;
}
