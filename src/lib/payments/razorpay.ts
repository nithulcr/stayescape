import "server-only";

import Razorpay from "razorpay";
import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature as verifySignature, verifyWebhookSignature as verifyWebhook } from "@/lib/payments/signatures";
import { hasWebhookSecret, validateRazorpayKeyPair } from "@/lib/payments/razorpay-config";
import type { RazorpayPaymentSnapshot } from "@/lib/payments/payment-check";
import type { PaymentRow, PlanRow } from "@/types/database.types";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
const razorpayConfig = validateRazorpayKeyPair({
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  isProduction: process.env.NODE_ENV === "production",
});

export const razorpayConfigured = razorpayConfig.ok;
export const razorpayKeyId = razorpayConfig.ok ? razorpayConfig.keyId : null;
export const razorpayWebhookConfigured = razorpayConfigured && hasWebhookSecret(webhookSecret);

export function getRazorpay() {
  if (!razorpayConfig.ok) return null;
  return new Razorpay({ key_id: razorpayConfig.keyId, key_secret: razorpayConfig.keySecret });
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!razorpayConfig.ok) return false;
  return verifySignature(razorpayConfig.keySecret, orderId, paymentId, signature);
}

export function verifyWebhookSignature(payload: string, signature: string) {
  if (!razorpayWebhookConfigured || !webhookSecret) return false;
  return verifyWebhook(webhookSecret, payload, signature);
}

export async function getPaymentByOrderId(orderId: string) {
  const admin = getAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("payments")
    .select("*, plan:plans(*)")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  return (data as (PaymentRow & { plan: PlanRow | null }) | null) ?? null;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentSnapshot | null> {
  const razorpay = getRazorpay();
  if (!razorpay) return null;

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    };
  } catch {
    return null;
  }
}

function revalidatePaymentPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/subscriptions");
}

export type PaymentActivationResult = {
  ok: boolean;
  message: string;
  subscription_id?: string | null;
  expires_at?: string | null;
};

export type PaymentRefundResult = {
  ok: boolean;
  message: string;
  refund_id?: string | null;
  refunded_amount?: number | null;
};

export async function activatePaidSubscription(input: {
  paymentId: string;
  razorpayPaymentId: string;
  durationMonths: number;
  signature?: string | null;
  eventId?: string | null;
}): Promise<PaymentActivationResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, message: "Service role key is not configured." };

  const { data, error } = await admin.rpc("activate_paid_subscription", {
    p_payment_id: input.paymentId,
    p_razorpay_payment_id: input.razorpayPaymentId,
    p_duration_months: input.durationMonths,
    p_signature: input.signature ?? null,
    p_event_id: input.eventId ?? null,
  });

  if (error || !data) return { ok: false, message: "Could not activate the subscription." };

  const result = data as PaymentActivationResult;
  if (result.ok) revalidatePaymentPaths();
  return result;
}

export async function recordPaymentStatus(input: {
  orderId: string;
  status: "failed" | "refunded";
  eventId?: string | null;
  razorpayPaymentId?: string | null;
}): Promise<PaymentActivationResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, message: "Service role key is not configured." };

  const { data, error } = await admin.rpc("record_payment_status", {
    p_order_id: input.orderId,
    p_status: input.status,
    p_event_id: input.eventId ?? null,
    p_razorpay_payment_id: input.razorpayPaymentId ?? null,
  });

  if (error || !data) return { ok: false, message: "Could not record the payment status." };

  const result = data as PaymentActivationResult;
  if (result.ok) revalidatePaymentPaths();
  return result;
}

export async function recordRefund(input: {
  orderId: string;
  eventId?: string | null;
  razorpayPaymentId?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundCurrency?: string | null;
  refundStatus?: string | null;
}): Promise<PaymentRefundResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, message: "Service role key is not configured." };

  const { data, error } = await admin.rpc("record_refund", {
    p_order_id: input.orderId,
    p_event_id: input.eventId ?? null,
    p_razorpay_payment_id: input.razorpayPaymentId ?? null,
    p_refund_id: input.refundId ?? null,
    p_refund_amount: input.refundAmount ?? null,
    p_refund_currency: input.refundCurrency ?? null,
    p_refund_status: input.refundStatus ?? null,
  });

  if (error || !data) return { ok: false, message: "Could not record the refund." };

  const result = data as PaymentRefundResult;
  if (result.ok) revalidatePaymentPaths();
  return result;
}

