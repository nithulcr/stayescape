"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { getBillingCycleLabel } from "@/lib/plans/billing-cycle";
import type { BillingCycle } from "@/types/database.types";

type OrderResponse = {
  error?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  planName?: string;
  billingCycle?: BillingCycle;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadCheckoutScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment gateway."));
    document.body.appendChild(script);
  });
}

export function CheckoutButton({
  billingCycle,
  label,
}: {
  billingCycle: BillingCycle;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });
      const order = (await response.json()) as OrderResponse;
      if (!response.ok || !order.orderId || !order.keyId || !order.amount) {
        throw new Error(order.error ?? "Could not start checkout.");
      }

      await loadCheckoutScript();
      if (!window.Razorpay) throw new Error("Payment gateway unavailable.");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: "STAYESCAPE",
        description: `${order.planName ?? "Premium"} (${getBillingCycleLabel(billingCycle)})`,
        order_id: order.orderId,
        theme: { color: "#123D32" },
        modal: {
          ondismiss: () => {
            setError("Payment was cancelled before completion. No amount was charged.");
          },
        },
        handler: async (payment: RazorpayResponse) => {
          const verification = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payment),
          });
          const result = (await verification.json()) as { ok: boolean; message?: string };
          if (!result.ok) {
            setError(result.message ?? "Payment verification failed.");
            return;
          }
          router.push("/dashboard/subscription");
          router.refresh();
        },
      });
      razorpay.open();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button type="button" onClick={checkout} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
        {loading ? "Opening checkout..." : label}
      </button>
      {error && <p className="mt-2 text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
