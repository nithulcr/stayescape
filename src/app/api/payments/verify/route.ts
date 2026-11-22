import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/guards";
import { getBillingDurationMonths } from "@/lib/plans/billing-cycle";
import { checkRazorpayPayment, isPaymentOwner, canActivatePaymentStatus } from "@/lib/payments/payment-check";
import {
  activatePaidSubscription,
  fetchRazorpayPayment,
  getPaymentByOrderId,
  verifyPaymentSignature,
} from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const context = await getAuthContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (context.profile?.account_status !== "active") {
    return NextResponse.json({ error: "This account cannot verify payments." }, { status: 403 });
  }
  if (!["owner", "admin", "super_admin"].includes(context.profile?.role ?? "")) {
    return NextResponse.json({ error: "Only owners can verify payments." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    razorpay_order_id?: unknown;
    razorpay_payment_id?: unknown;
    razorpay_signature?: unknown;
  };

  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";
  if (!orderId || !paymentId || !signature || orderId.length > 200 || paymentId.length > 200 || signature.length > 200) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const payment = await getPaymentByOrderId(orderId);
  if (!payment || !isPaymentOwner(payment.user_id, context.user.id)) {
    return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
  }
  if (!canActivatePaymentStatus(payment.status)) {
    return NextResponse.json({ ok: true, message: "Payment already recorded." });
  }
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  const razorpayPayment = await fetchRazorpayPayment(paymentId);
  const matches = checkRazorpayPayment({
    expectedOrderId: orderId,
    expectedPaymentId: paymentId,
    expectedAmount: payment.amount,
    expectedCurrency: payment.currency,
    payment: razorpayPayment,
  });
  if (!matches.ok) return NextResponse.json({ error: matches.message }, { status: 400 });

  const result = await activatePaidSubscription({
    paymentId: payment.id,
    razorpayPaymentId: paymentId,
    durationMonths: getBillingDurationMonths(payment.billing_cycle),
    signature,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
