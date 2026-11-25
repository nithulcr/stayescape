"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { manualApprovalConfirmation } from "@/lib/payments/manual/config";
import { isUuid, normalizePaymentReference } from "@/lib/payments/manual/validation";
import { getServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

type RpcResult = {
  ok?: boolean;
  message?: string;
  expires_at?: string | null;
  duplicate?: boolean;
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

function revalidateManualPaths() {
  revalidatePath("/admin/manual-requests");
  revalidatePath("/dashboard/subscription");
}

function successMessage(prefix: string, expiresAt: string | null | undefined): string {
  return expiresAt ? `${prefix} Premium is active until ${new Date(expiresAt).toLocaleDateString("en-IN")}.` : `${prefix} Premium is active.`;
}

export async function verifyManualPaymentAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Database not configured." };

  const requestId = textValue(formData.get("requestId"));
  if (!isUuid(requestId)) return { ok: false, message: "Invalid payment request." };

  const verifiedReference = normalizePaymentReference(formData.get("verifiedReference"));
  if (!verifiedReference) {
    return {
      ok: false,
      message: "Enter the actual bank or UPI transaction reference.",
      fieldErrors: { verifiedReference: ["Enter a valid transaction reference."] },
    };
  }

  const bankCreditVerified = textValue(formData.get("bankCreditVerified"));
  if (bankCreditVerified !== "on" && bankCreditVerified !== "true") {
    return {
      ok: false,
      message: "Confirm that the bank or UPI credit was checked before marking payment verified.",
      fieldErrors: { bankCreditVerified: ["Bank or UPI credit confirmation is required."] },
    };
  }

  const { data, error } = await supabase.rpc("admin_verify_manual_payment", {
    p_request_id: requestId,
    p_verified_reference: verifiedReference,
    p_notes: textValue(formData.get("notes")) || null,
    p_bank_credit_verified: true,
    p_actor_id: user.id,
    p_actor_email: profile?.email ?? user.email ?? "",
  });

  const result = data as RpcResult | null;
  if (error || !result?.ok) return rpcFailure(result, "Could not mark the payment as verified.");

  revalidateManualPaths();
  return { ok: true, message: "Payment marked as verified. Review it again before approval." };
}

export async function rejectManualPaymentAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Database not configured." };

  const requestId = textValue(formData.get("requestId"));
  if (!isUuid(requestId)) return { ok: false, message: "Invalid payment request." };

  const reason = textValue(formData.get("reason"));
  if (reason.length < 3 || reason.length > 500) {
    return {
      ok: false,
      message: "Enter a rejection reason of at least 3 characters.",
      fieldErrors: { reason: ["Enter a rejection reason of at least 3 characters."] },
    };
  }

  const { data, error } = await supabase.rpc("admin_reject_manual_request", {
    p_request_id: requestId,
    p_reason: reason,
    p_actor_id: user.id,
    p_actor_email: profile?.email ?? user.email ?? "",
  });

  const result = data as RpcResult | null;
  if (error || !result?.ok) return rpcFailure(result, "Could not reject the payment request.");

  revalidateManualPaths();
  return { ok: true, message: "Payment request rejected. Premium was not changed." };
}

export async function approveManualPaymentAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Database not configured." };

  const requestId = textValue(formData.get("requestId"));
  if (!isUuid(requestId)) return { ok: false, message: "Invalid payment request." };

  const confirmation = textValue(formData.get("confirmation"));
  if (confirmation !== manualApprovalConfirmation) {
    return {
      ok: false,
      message: `Type ${manualApprovalConfirmation} to approve this payment.`,
      fieldErrors: { confirmation: [`Type ${manualApprovalConfirmation} to approve this payment.`] },
    };
  }

  const { data, error } = await supabase.rpc("admin_approve_manual_request", {
    p_request_id: requestId,
    p_notes: textValue(formData.get("notes")) || null,
    p_actor_id: user.id,
    p_actor_email: profile?.email ?? user.email ?? "",
  });

  const result = data as RpcResult | null;
  if (error || !result?.ok) return rpcFailure(result, "Could not approve the payment request.");

  revalidateManualPaths();
  return {
    ok: true,
    message: result.duplicate
      ? "This payment was already approved. Premium was not extended again."
      : successMessage("Verified manual payment approved.", result.expires_at),
  };
}
