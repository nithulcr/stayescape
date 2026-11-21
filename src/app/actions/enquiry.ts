"use server";

import { getServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { enquirySchema, schemaFieldErrors } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function submitEnquiryAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse({
    property_id: formData.get("property_id"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    check_in: formData.get("check_in"),
    check_out: formData.get("check_out"),
    guests: formData.get("guests"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  if (!(await enforceRateLimit("enquiry", parsed.data.email.toLowerCase()))) {
    return { ok: false, message: "Too many enquiries. Please try again later." };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Enquiries are not available until Supabase is configured.",
    };
  }

  const { error } = await supabase.from("enquiries").insert({
    property_id: parsed.data.property_id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    check_in: parsed.data.check_in ?? null,
    check_out: parsed.data.check_out ?? null,
    guests: parsed.data.guests ?? null,
    message: parsed.data.message,
    status: "new",
  });

  if (error) {
    return { ok: false, message: "We could not send your enquiry. Please try again." };
  }

  return {
    ok: true,
    message: "Thank you. Your enquiry has been sent to the property owner.",
  };
}
