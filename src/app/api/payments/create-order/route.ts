import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/guards";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPlans } from "@/lib/plans/limits";
import { getRazorpay, razorpayConfigured } from "@/lib/payments/razorpay";
import { preparePremiumOrder } from "@/lib/payments/order-request";

export async function POST(request: NextRequest) {
  const context = await getAuthContext();
  if (!context) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  if (!razorpayConfigured) {
    return NextResponse.json(
      {
        error:
          "Razorpay is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments.",
      },
      { status: 503 },
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to record payments." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { billingCycle?: unknown };
  const prepared = preparePremiumOrder({
    userId: context.user.id,
    billingCycle: body.billingCycle,
    plans: await getPlans(),
    role: context.profile?.role,
    accountStatus: context.profile?.account_status,
  });
  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.message }, { status: prepared.status });
  }

  const razorpay = getRazorpay();
  if (!razorpay) return NextResponse.json({ error: "Payment gateway unavailable." }, { status: 503 });

  try {
    const order = await razorpay.orders.create({
      amount: prepared.amount,
      currency: prepared.currency,
      receipt: `STAYESCAPE_${crypto.randomUUID().slice(0, 12)}`,
      notes: {
        user_id: prepared.userId,
        plan_code: prepared.plan.code,
        billing_cycle: prepared.billingCycle,
      },
    });

    const orderNotes = order.notes as Record<string, unknown> | undefined;
    if (orderNotes?.user_id && orderNotes.user_id !== prepared.userId) {
      return NextResponse.json({ error: "Could not create a payment order." }, { status: 502 });
    }

    const { error } = await admin.from("payments").insert({
      user_id: prepared.userId,
      plan_id: prepared.plan.id,
      razorpay_order_id: order.id,
      amount: prepared.amount,
      currency: prepared.currency,
      billing_cycle: prepared.billingCycle,
      status: "pending",
    });
    if (error) {
      return NextResponse.json({ error: "Could not create a payment record." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: prepared.amount,
      currency: prepared.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      planName: prepared.plan.name,
      billingCycle: prepared.billingCycle,
    });
  } catch {
    return NextResponse.json({ error: "Could not create a Razorpay order." }, { status: 502 });
  }
}
