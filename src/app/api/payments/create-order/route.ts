import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/guards";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPlanPriceForBillingCycle } from "@/lib/plans/billing-cycle";
import { getPlans } from "@/lib/plans/limits";
import { getRazorpay, razorpayConfigured } from "@/lib/payments/razorpay";
import { billingCycleSchema } from "@/lib/validations";

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

  const body = (await request.json().catch(() => ({}))) as { billingCycle?: string };
  const parsedCycle = billingCycleSchema.safeParse(body.billingCycle);
  if (!parsedCycle.success) {
    return NextResponse.json({ error: "Choose a valid billing cycle." }, { status: 400 });
  }
  const billingCycle = parsedCycle.data;

  const plans = await getPlans();
  const premium = plans.find((plan) => plan.code === "premium" && plan.is_active);
  if (!premium) {
    return NextResponse.json({ error: "Premium plan is not available yet." }, { status: 503 });
  }

  const amount = Math.round(getPlanPriceForBillingCycle(premium, billingCycle) * 100);
  if (amount <= 0) {
    return NextResponse.json({ error: "Plan price is not configured." }, { status: 503 });
  }

  const razorpay = getRazorpay();
  if (!razorpay) return NextResponse.json({ error: "Payment gateway unavailable." }, { status: 503 });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `stayscape_${crypto.randomUUID().slice(0, 12)}`,
      notes: {
        user_id: context.user.id,
        plan_code: "premium",
        billing_cycle: billingCycle,
      },
    });

    const { error } = await admin.from("payments").insert({
      user_id: context.user.id,
      plan_id: premium.id,
      razorpay_order_id: order.id,
      amount,
      currency: "INR",
      billing_cycle: billingCycle,
      status: "pending",
    });
    if (error) {
      return NextResponse.json({ error: "Could not create a payment record." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      planName: premium.name,
      billingCycle,
    });
  } catch {
    return NextResponse.json({ error: "Could not create a Razorpay order." }, { status: 502 });
  }
}
