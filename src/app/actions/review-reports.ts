"use server";

import { getAuthContext } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getServerClient } from "@/lib/supabase/server";
import { reviewReportSchema, schemaFieldErrors } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function submitReviewReportAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reviewReportSchema.safeParse({
    review_id: formData.get("review_id"),
    guest_token: formData.get("guest_token"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const context = await getAuthContext();
  const guestToken = parsed.data.guest_token || null;
  if (!context && !guestToken) {
    return { ok: false, message: "Sign in or enable guest reviews to report this review." };
  }

  if (!(await enforceRateLimit("review", `${parsed.data.review_id}|report`))) {
    return { ok: false, message: "Too many reports. Please try again later." };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { ok: false, message: "Review reports are not available until Supabase is configured." };
  }

  const { error } = await supabase.from("review_reports").insert({
    review_id: parsed.data.review_id,
    reporter_user_id: context?.user.id ?? null,
    reporter_guest_token: context ? null : guestToken,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });

  if (error) {
    return { ok: false, message: "We could not submit your report. Please try again." };
  }

  return { ok: true, message: "Thank you. Our moderation team will review this report." };
}
