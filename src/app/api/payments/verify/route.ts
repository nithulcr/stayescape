import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/guards";
import { getAdminClient } from "@/lib/supabase/admin";
import { activatePaidSubscription } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const context = await getAuthContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  const { data: payment } = await admin
    .from("payments")
    .select("user_id")
    .eq("razorpay_order_id", body.razorpay_order_id)
    .maybeSingle();
  if (!payment || payment.user_id !== context.user.id) {
    return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
  }

  const result = await activatePaidSubscription({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
