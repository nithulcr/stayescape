"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/guards";
import { getServerClient } from "@/lib/supabase/server";
import { parseOptional } from "@/lib/validations";

export async function moderateOwnerReviewAction(formData: FormData) {
  const { user } = await requireOwner();
  const supabase = await getServerClient();
  if (!supabase) return;

  const reviewId = parseOptional(formData.get("reviewId"));
  const status = parseOptional(formData.get("status"));
  if (!reviewId || (status !== "approved" && status !== "rejected")) return;

  const { data: review } = await supabase
    .from("reviews")
    .select("id,property_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return;

  const { data: property } = await supabase
    .from("properties")
    .select("slug,owner_id")
    .eq("id", review.property_id)
    .maybeSingle();
  if (!property || property.owner_id !== user.id) return;

  await supabase.from("reviews").update({ status }).eq("id", review.id);
  revalidatePath("/dashboard/reviews");
  revalidatePath(`/properties/${property.slug}`);
}

export async function deleteOwnerReviewAction(formData: FormData) {
  const { user } = await requireOwner();
  const supabase = await getServerClient();
  if (!supabase) return;

  const reviewId = parseOptional(formData.get("reviewId"));
  if (!reviewId) return;

  const { data: review } = await supabase
    .from("reviews")
    .select("id,property_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return;

  const { data: property } = await supabase
    .from("properties")
    .select("slug,owner_id")
    .eq("id", review.property_id)
    .maybeSingle();
  if (!property || property.owner_id !== user.id) return;

  await supabase.from("reviews").delete().eq("id", review.id);
  revalidatePath("/dashboard/reviews");
  revalidatePath(`/properties/${property.slug}`);
}
