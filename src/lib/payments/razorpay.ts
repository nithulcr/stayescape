import "server-only";

import Razorpay from "razorpay";
import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature as verifySignature, verifyWebhookSignature as verifyWebhook } from "@/lib/payments/signatures";
import type { RazorpayPaymentSnapshot } from "@/lib/payments/payment-check";
import type { PaymentRow, PlanRow } from "@/types/database.types";

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export const razorpayConfigured = Boolean(keyId && keySecret);

export function getRazorpay() {
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  return keySecret ? verifySignature(keySecret, orderId, paymentId, signature) : false;
}

export function verifyWebhookSignature(payload: string, signature: string) {
  return webhookSecret ? verifyWebhook(webhookSecret, payload, signature) : false;
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

