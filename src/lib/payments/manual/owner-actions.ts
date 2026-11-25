"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/guards";
import { manualPaymentProofBucket } from "@/lib/config";
import { buildManualWhatsAppUrl } from "@/lib/payments/manual/message";
import {
  isUuid,
  manualProofPath,
  normalizePaymentReference,
} from "@/lib/payments/manual/validation";
import { getBillingDurationLabel, getBillingDurationMonths, getPlanPriceForBillingCycle, isBillingCycle } from "@/lib/plans/billing-cycle";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { validateImageUpload } from "@/lib/uploads/validate-image";
import { formatINR } from "@/lib/utils";
import type { PlanRow } from "@/types/database.types";
import type { ActionResult } from "@/types";

type RpcResult = {
  ok?: boolean;
  message?: string;
  request_id?: string;
  fieldErrors?: Record<string, string[]>;
};

function textValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function rpcFailure(result: RpcResult | null, fallback: string): ActionResult {
  return {
    ok: false,
    message: result?.message ?? fallback,
    fieldErrors: result?.fieldErrors,
  };
}

async function getPremiumPlan(): Promise<PlanRow | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("code", "premium")
    .eq("is_active", true)
    .maybeSingle();
  return (data as PlanRow | null) ?? null;
}

export async function startManualRequestAction(billingCycle: string): Promise<ActionResult> {
  if (!isBillingCycle(billingCycle)) {
    return { ok: false, message: "Choose a valid billing cycle." };
  }

  const { user, profile } = await requireOwner("/dashboard/subscription");
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Database not configured." };

  if (!(await enforceRateLimit("upload", `manual-request:${user.id}`))) {
    return { ok: false, message: "Too many payment requests. Please try again later." };
  }

  const plan = await getPremiumPlan();
  if (!plan) return { ok: false, message: "Premium is not configured yet." };

  const amount = Math.round(getPlanPriceForBillingCycle(plan, billingCycle) * 100);
  const durationMonths = getBillingDurationMonths(billingCycle);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, message: "Premium pricing is not configured." };
  }

  const { data, error } = await supabase.rpc("create_manual_subscription_request", {
    p_owner_id: user.id,
    p_plan_id: plan.id,
    p_billing_cycle: billingCycle,
    p_amount: amount,
    p_currency: "INR",
    p_duration_months: durationMonths,
    p_actor_id: user.id,
    p_actor_email: profile?.email ?? user.email ?? "",
  });

  const result = data as RpcResult | null;
  if (error || !result?.ok || !result.request_id) {
    return rpcFailure(result, "Could not create a payment request.");
  }

  revalidatePath("/dashboard/subscription");
  return {
    ok: true,
    message: "Payment request created. Continue in WhatsApp with the prefilled details.",
    whatsappUrl: buildManualWhatsAppUrl({
      ownerName: profile?.full_name ?? "Stay Escape owner",
      ownerId: user.id,
      planName: plan.name,
      amount: formatINR(amount / 100),
      durationLabel: getBillingDurationLabel(billingCycle),
    }),
  };
}

export async function submitManualPaymentAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireOwner("/dashboard/subscription");
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Database not configured." };

  const requestId = textValue(formData.get("requestId"));
  if (!isUuid(requestId)) {
    return { ok: false, message: "Invalid payment request." };
  }

  const paymentReference = normalizePaymentReference(formData.get("paymentReference"));
  if (!paymentReference) {
    return {
      ok: false,
      message: "Enter a valid transaction reference using 6 to 64 letters, numbers, slashes, underscores or hyphens.",
      fieldErrors: {
        paymentReference: ["Enter a valid transaction reference."],
      },
    };
  }

  const proof = formData.get("proof");
  if (!(proof instanceof File)) {
    return {
      ok: false,
      message: "Attach a screenshot of the payment confirmation.",
      fieldErrors: { proof: ["A payment screenshot is required."] },
    };
  }

  const { data: request } = await supabase
    .from("manual_subscription_requests")
    .select("id,status,owner_id")
    .eq("id", requestId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!request || request.status !== "pending" || request.owner_id !== user.id) {
    return { ok: false, message: "This payment request is no longer open." };
  }

  if (!(await enforceRateLimit("upload", `manual-proof:${user.id}`))) {
    return { ok: false, message: "Too many uploads. Please try again later." };
  }

  const validation = await validateImageUpload(proof);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.error,
      fieldErrors: { proof: [validation.error] },
    };
  }

  const storage = (getAdminClient() ?? supabase).storage.from(manualPaymentProofBucket);
  const path = manualProofPath(user.id, requestId, `${crypto.randomUUID()}.${validation.image.extension}`);
  const { error: uploadError } = await storage.upload(path, validation.image.bytes, {
    contentType: validation.image.contentType,
    upsert: false,
  });
  if (uploadError) {
    return { ok: false, message: "The payment screenshot could not be uploaded. Please try again." };
  }

  const { data, error } = await supabase.rpc("owner_submit_manual_payment", {
    p_request_id: requestId,
    p_payment_reference: paymentReference,
    p_proof_path: path,
    p_actor_id: user.id,
  });

  const result = data as RpcResult | null;
  if (error || !result?.ok) {
    await storage.remove([path]);
    return rpcFailure(result, "Could not submit the payment details.");
  }

  revalidatePath("/dashboard/subscription");
  revalidatePath("/admin/manual-requests");
  return { ok: true, message: "Payment details submitted for verification." };
}
