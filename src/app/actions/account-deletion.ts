"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { accountDeletionSchema, schemaFieldErrors } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function requestAccountDeletionAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireUser("/account-deletion");
  const parsed = accountDeletionSchema.safeParse({
    confirmation: formData.get("confirmation"),
    email: formData.get("email"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  if (parsed.data.email.toLowerCase() !== (context.user.email ?? "").toLowerCase()) {
    return { ok: false, message: "The email address does not match your account." };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { ok: false, message: "Account deletion is not available until Supabase is configured." };
  }

  const admin = getAdminClient();
  const writer = admin ?? supabase;
  const emailSnapshot = context.user.email ?? parsed.data.email;

  const { data: deletionRequest, error: requestError } = await supabase
    .from("account_deletion_requests")
    .insert({
      user_id: context.user.id,
      email_snapshot: emailSnapshot,
      reason: parsed.data.reason || null,
      status: "pending",
    })
    .select("id")
    .single();
  if (requestError || !deletionRequest) {
    return { ok: false, message: "We could not record your deletion request. Please try again." };
  }

  await writer
    .from("reviews")
    .update({ user_id: null, reviewer_name: "Former guest" })
    .eq("user_id", context.user.id);

  await writer
    .from("properties")
    .update({ status: "rejected" })
    .eq("owner_id", context.user.id);

  const profileUpdate = {
    full_name: "Deleted user",
    email: `deleted-${context.user.id}@invalid.local`,
    phone: null,
    whatsapp_number: null,
    avatar_url: null,
  };

  if (admin) {
    await admin
      .from("profiles")
      .update({ ...profileUpdate, account_status: "suspended" })
      .eq("id", context.user.id);
  } else {
    await supabase.from("profiles").update(profileUpdate).eq("id", context.user.id);
  }

  let hardDeleted = false;
  if (admin) {
    const [{ count: paymentCount }, { count: subscriptionCount }] = await Promise.all([
      admin.from("payments").select("id", { count: "exact", head: true }).eq("user_id", context.user.id),
      admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("owner_id", context.user.id),
    ]);
    if ((paymentCount ?? 0) === 0 && (subscriptionCount ?? 0) === 0) {
      const { error } = await admin.auth.admin.deleteUser(context.user.id);
      hardDeleted = !error;
    }
  }

  await writer
    .from("account_deletion_requests")
    .update({ status: hardDeleted ? "completed" : "anonymised", completed_at: new Date().toISOString() })
    .eq("id", deletionRequest.id);

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/account-deletion?deleted=1");
}
