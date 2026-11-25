import type { PaymentStatus } from "../../types/database.types";

export type RazorpayPaymentSnapshot = {
  id?: unknown;
  order_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
};

export type PaymentCheckResult = { ok: true } | { ok: false; message: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function checkRazorpayPayment(input: {
  expectedOrderId: string;
  expectedPaymentId: string;
  expectedAmount: number;
  expectedCurrency: string;
  payment: RazorpayPaymentSnapshot | null;
}): PaymentCheckResult {
  if (!input.payment) return { ok: false, message: "Payment could not be verified with Razorpay." };
  if (asString(input.payment.id) !== input.expectedPaymentId) {
    return { ok: false, message: "Payment id does not match this order." };
  }
  if (asString(input.payment.order_id) !== input.expectedOrderId) {
    return { ok: false, message: "Payment does not belong to this order." };
  }
  if (asAmount(input.payment.amount) !== input.expectedAmount) {
    return { ok: false, message: "Payment amount does not match this order." };
  }
  if ((asString(input.payment.currency) ?? "").toUpperCase() !== input.expectedCurrency.toUpperCase()) {
    return { ok: false, message: "Payment currency does not match this order." };
  }
  if (asString(input.payment.status) !== "captured") {
    return { ok: false, message: "Payment has not been captured." };
  }
  return { ok: true };
}

export function isPaymentOwner(
  paymentUserId: string | null | undefined,
  sessionUserId: string | null | undefined,
) {
  return Boolean(paymentUserId && sessionUserId && paymentUserId === sessionUserId);
}

export function canActivatePaymentStatus(status: PaymentStatus | string | null | undefined) {
  return status === "pending" || status === "failed";
}

export const SUPPORTED_WEBHOOK_EVENTS = [
  "payment.captured",
  "order.paid",
  "payment.failed",
  "refund.created",
] as const;

export function isSupportedWebhookEvent(eventType: string) {
  return (SUPPORTED_WEBHOOK_EVENTS as readonly string[]).includes(eventType);
}

export const SUCCESSFUL_REFUND_STATUSES = ["processed", "refunded", "success"] as const;

export function isSuccessfulRefundStatus(status: string | null | undefined) {
  return Boolean(
    status &&
      (SUCCESSFUL_REFUND_STATUSES as readonly string[]).includes(status.trim().toLowerCase()),
  );
}

export function checkRefundEvent(input: {
  amount: number | null;
  currency: string | null;
  status: string | null;
  expectedCurrency: string;
}): PaymentCheckResult {
  if (!isSuccessfulRefundStatus(input.status)) {
    return { ok: false, message: "Refund is not final." };
  }
  if (input.amount === null || !Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false, message: "Invalid refund amount." };
  }
  if (
    !input.currency ||
    input.currency.trim().toUpperCase() !== input.expectedCurrency.trim().toUpperCase()
  ) {
    return { ok: false, message: "Refund currency does not match this order." };
  }
  return { ok: true };
}

export type WebhookEventSummary = {
  eventId: string | null;
  eventType: string;
  paymentId: string | null;
  orderId: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  refundId: string | null;
};

export function parseWebhookEvent(payload: unknown): WebhookEventSummary {
  const root = asRecord(payload);
  const body = asRecord(root.payload);
  const paymentContainer = asRecord(body.payment);
  const paymentEntity = asRecord(paymentContainer.entity);
  const orderEntity = asRecord(asRecord(body.order).entity);
  const refundEntity = asRecord(asRecord(body.refund).entity);
  const paymentFallback = Array.isArray(body.payment) ? asRecord(body.payment[0]) : paymentContainer;

  return {
    eventId: asString(root.id),
    eventType: asString(root.event) ?? "",
    paymentId: asString(paymentEntity.id) ?? asString(paymentFallback.id) ?? asString(refundEntity.payment_id),
    orderId:
      asString(paymentEntity.order_id) ??
      asString(paymentFallback.order_id) ??
      asString(orderEntity.id),
    amount: asAmount(
      refundEntity.amount ?? paymentEntity.amount ?? paymentFallback.amount ?? orderEntity.amount_paid ?? orderEntity.amount,
    ),
    currency: asString(refundEntity.currency ?? paymentEntity.currency ?? paymentFallback.currency ?? orderEntity.currency),
    status: asString(refundEntity.status ?? paymentEntity.status ?? paymentFallback.status ?? orderEntity.status),
    refundId: asString(refundEntity.id),
  };
}
