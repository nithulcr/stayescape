import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { revalidatePath } from "next/cache";
import { addBillingCycleMonths } from "@/lib/plans/billing-cycle";
import { getAdminClient } from "@/lib/supabase/admin";
import type { PaymentRow, PlanRow, SubscriptionRow } from "@/types/database.types";

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export const razorpayConfigured = Boolean(keyId && keySecret);

export function getRazorpay() {
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function matches(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return matches(expected, signature);
}

export function verifyWebhookSignature(payload: string, signature: string) {
  if (!webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(payload).digest("hex");
  return matches(expected, signature);
}

export async function activatePaidSubscription(input: {
  orderId: string;
  paymentId: string;
  signature?: string | null;
  trusted?: boolean;
}) {
  const admin = getAdminClient();
  if (!admin) return { ok: false, message: "Service role key is not configured." };

  const { data: paymentData } = await admin
    .from("payments")
    .select("*, plan:plans(*)")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();

  const payment = paymentData as
    | (PaymentRow & { plan: PlanRow | null })
    | null;
  if (!payment) return { ok: false, message: "Unknown payment order." };
  if (!payment.plan || payment.plan.code !== "premium") {
    return { ok: false, message: "Plan not found for this payment." };
  }
  if (!input.trusted && !verifyPaymentSignature(input.orderId, input.paymentId, input.signature ?? "")) {
    return { ok: false, message: "Invalid payment signature." };
  }

  if (payment.status === "success") {
    return { ok: true, message: "Payment already recorded." };
  }

  let expiresAt = addBillingCycleMonths(new Date(), payment.billing_cycle);

  const { data: current } = await admin
    .from("subscriptions")
    .select("*")
    .eq("owner_id", payment.user_id)
    .eq("status", "active")
    .maybeSingle();

  const currentSubscription = current as SubscriptionRow | null;
  if (currentSubscription?.expires_at && new Date(currentSubscription.expires_at) > new Date()) {
    expiresAt = addBillingCycleMonths(new Date(currentSubscription.expires_at), payment.billing_cycle);
  }

  if (currentSubscription) {
    const { error: subscriptionError } = await admin
      .from("subscriptions")
      .update({
        plan_id: payment.plan_id,
        status: "active",
        billing_cycle: payment.billing_cycle,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: false,
      })
      .eq("id", currentSubscription.id);
    if (subscriptionError) return { ok: false, message: subscriptionError.message };
  } else {
    const { error: subscriptionError } = await admin.from("subscriptions").insert({
      owner_id: payment.user_id,
      plan_id: payment.plan_id,
      status: "active",
      billing_cycle: payment.billing_cycle,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew: false,
    });
    if (subscriptionError) return { ok: false, message: subscriptionError.message };
  }

  const { error: paymentError } = await admin
    .from("payments")
    .update({
      razorpay_payment_id: input.paymentId,
      razorpay_signature: input.signature ?? null,
      status: "success",
    })
    .eq("id", payment.id);
  if (paymentError) return { ok: false, message: paymentError.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/admin/subscriptions");
  return { ok: true, message: "Subscription activated." };
}
