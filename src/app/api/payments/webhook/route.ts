import { NextResponse, type NextRequest } from "next/server";
import { activatePaidSubscription, verifyWebhookSignature } from "@/lib/payments/razorpay";

type WebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const raw = await request.text();

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as WebhookPayload;
  const payment = event.payload?.payment?.entity;

  const isCaptured = event.event === "payment.captured" && payment?.status === "captured";
  const isPaidOrder = event.event === "order.paid";

  if ((isCaptured || isPaidOrder) && payment?.id && payment.order_id) {
    const result = await activatePaidSubscription({
      orderId: payment.order_id,
      paymentId: payment.id,
      trusted: true,
    });
    if (!result.ok) return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json({ received: true });
}
