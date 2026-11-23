import { NextResponse, type NextRequest } from "next/server";
import { getBillingDurationMonths } from "@/lib/plans/billing-cycle";
import {
  checkRazorpayPayment,
  isSupportedWebhookEvent,
  parseWebhookEvent,
} from "@/lib/payments/payment-check";
import {
  activatePaidSubscription,
  fetchRazorpayPayment,
  getPaymentByOrderId,
  recordPaymentStatus,
  verifyWebhookSignature,
} from "@/lib/payments/razorpay";

const SUCCESS_EVENTS = new Set(["payment.captured", "order.paid"]);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const raw = await request.text();

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const event = parseWebhookEvent(payload);
  if (!isSupportedWebhookEvent(event.eventType)) {
    return NextResponse.json({ received: true, ignored: true });
  }
  if (event.eventType === "payment.failed" && event.status && event.status !== "failed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  let orderId = event.orderId;
  if (!orderId && event.paymentId) {
    const gatewayPayment = await fetchRazorpayPayment(event.paymentId);
    if (gatewayPayment && typeof gatewayPayment.order_id === "string") {
      orderId = gatewayPayment.order_id;
    }
  }
  if (!orderId) return NextResponse.json({ received: true, ignored: true });

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return NextResponse.json({ received: true, ignored: true });

  if (SUCCESS_EVENTS.has(event.eventType)) {
    const razorpayPaymentId = event.paymentId ?? payment.razorpay_payment_id;
    if (!razorpayPaymentId) return NextResponse.json({ received: true, ignored: true });

    const gatewayPayment = await fetchRazorpayPayment(razorpayPaymentId);
    if (!gatewayPayment) {
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 500 });
    }

    const matches = checkRazorpayPayment({
      expectedOrderId: orderId,
      expectedPaymentId: razorpayPaymentId,
      expectedAmount: payment.amount,
      expectedCurrency: payment.currency,
      payment: gatewayPayment,
    });
    if (!matches.ok) return NextResponse.json({ error: matches.message }, { status: 422 });

    const result = await activatePaidSubscription({
      paymentId: payment.id,
      razorpayPaymentId,
      durationMonths: getBillingDurationMonths(payment.billing_cycle),
      eventId: event.eventId,
    });
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ received: true, activated: result.ok });
  }

  const result = await recordPaymentStatus({
    orderId,
    status: event.eventType === "payment.failed" ? "failed" : "refunded",
    eventId: event.eventId,
    razorpayPaymentId: event.paymentId,
  });
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json({ received: true });
}
