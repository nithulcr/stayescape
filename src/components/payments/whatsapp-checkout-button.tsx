"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { startManualRequestAction } from "@/lib/payments/manual/owner-actions";
import type { BillingCycle } from "@/types/database.types";

export function WhatsAppCheckoutButton({
  billingCycle,
  label = "Continue via WhatsApp",
}: {
  billingCycle: BillingCycle;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const openWhatsApp = () => {
    setError("");
    startTransition(async () => {
      const result = await startManualRequestAction(billingCycle);
      if (!result.ok || !result.whatsappUrl) {
        setError(result.message || "Could not open WhatsApp.");
        return;
      }
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      router.refresh();
    });
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={openWhatsApp}
        disabled={pending}
        className="btn-primary w-full justify-center disabled:opacity-60"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
        {pending ? "Preparing WhatsApp..." : label}
      </button>
      {error ? <p className="mt-2 text-center text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
