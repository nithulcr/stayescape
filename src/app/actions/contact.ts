"use server";

import { getServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { contactMessageSchema, schemaFieldErrors } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function submitContactMessageAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  if (!(await enforceRateLimit("contact", parsed.data.email.toLowerCase()))) {
    return { ok: false, message: "Too many messages. Please try again later." };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { ok: false, message: "Contact messages are not available until Supabase is configured." };
  }

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
  });

  if (error) {
    return { ok: false, message: "We could not send your message. Please try again." };
  }

  return { ok: true, message: "Thank you. Your message has been received." };
}
