"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/guards";
import { getServerClient } from "@/lib/supabase/server";
import {
  parseOptional,
  reviewSchema,
  reviewUpdateSchema,
  schemaFieldErrors,
} from "@/lib/validations";
import type { ActionResult } from "@/types";

function guestTokenFrom(value: unknown) {
  const token = parseOptional(value);
  return token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    ? token
    : undefined;
}

export async function submitReviewAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse({
    property_id: formData.get("property_id"),
    rating: formData.get("rating"),
    guest_token: formData.get("guest_token"),
    title: formData.get("title"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your review.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Reviews are not available right now." };

  const { data: property } = await supabase
    .from("properties")
    .select("slug,owner_id,status")
    .eq("id", parsed.data.property_id)
    .maybeSingle();
  if (!property || property.status !== "approved") {
    return { ok: false, message: "This property is not available for reviews." };
  }

  const auth = await getAuthContext();
  const userId = auth?.user.id ?? null;
  const guestToken = userId ? undefined : guestTokenFrom(parsed.data.guest_token);
  if (!userId && !guestToken) {
    return { ok: false, message: "Please enable browser storage and try again." };
  }
  if (userId && property.owner_id === userId) {
    return { ok: false, message: "Property owners cannot review their own listings." };
  }

  let duplicateQuery = supabase
    .from("reviews")
    .select("id")
    .eq("property_id", parsed.data.property_id);
  if (userId) {
    duplicateQuery = duplicateQuery.eq("user_id", userId);
  } else if (guestToken) {
    duplicateQuery = duplicateQuery.eq("guest_token", guestToken);
  }
  const { data: existing } = await duplicateQuery.maybeSingle();
  if (existing) {
    return { ok: false, message: "You have already reviewed this property. Edit your review instead." };
  }

  const { error } = await supabase.from("reviews").insert({
    property_id: parsed.data.property_id,
    user_id: userId,
    guest_token: guestToken ?? null,
    reviewer_name: auth?.profile?.full_name?.trim() || "Guest traveller",
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    comment: parsed.data.comment,
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "You have already reviewed this property." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath(`/properties/${property.slug}`);
  return { ok: true, message: "Thank you. Your review was submitted for moderation." };
}

export async function updateReviewAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reviewUpdateSchema.safeParse({
    review_id: formData.get("review_id"),
    property_id: formData.get("property_id"),
    rating: formData.get("rating"),
    guest_token: formData.get("guest_token"),
    title: formData.get("title"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your review.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Reviews are not available right now." };

  const auth = await getAuthContext();
  const userId = auth?.user.id ?? null;
  const guestToken = userId ? undefined : guestTokenFrom(parsed.data.guest_token);
  if (!userId && !guestToken) {
    return { ok: false, message: "Please enable browser storage and try again." };
  }

  let reviewQuery = supabase
    .from("reviews")
    .select("id,property_id")
    .eq("id", parsed.data.review_id);
  if (userId) {
    reviewQuery = reviewQuery.eq("user_id", userId);
  } else if (guestToken) {
    reviewQuery = reviewQuery.eq("guest_token", guestToken);
  }
  const { data: review } = await reviewQuery.maybeSingle();
  if (!review) return { ok: false, message: "Review not found." };

  const { data: property } = await supabase
    .from("properties")
    .select("slug")
    .eq("id", review.property_id)
    .maybeSingle();

  const { error } = await supabase
    .from("reviews")
    .update({
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment,
      status: "pending",
    })
    .eq("id", review.id);
  if (error) return { ok: false, message: error.message };

  if (property) revalidatePath(`/properties/${property.slug}`);
  return { ok: true, message: "Your review was updated and sent for moderation." };
}

export async function deleteReviewAction(formData: FormData) {
  const reviewId = parseOptional(formData.get("review_id"));
  if (!reviewId) return;

  const supabase = await getServerClient();
  if (!supabase) return;

  const auth = await getAuthContext();
  const userId = auth?.user.id ?? null;
  const guestToken = userId ? undefined : guestTokenFrom(formData.get("guest_token"));
  if (!userId && !guestToken) return;

  let reviewQuery = supabase.from("reviews").select("id,property_id").eq("id", reviewId);
  if (userId) {
    reviewQuery = reviewQuery.eq("user_id", userId);
  } else if (guestToken) {
    reviewQuery = reviewQuery.eq("guest_token", guestToken);
  }
  const { data: review } = await reviewQuery.maybeSingle();
  if (!review) return;

  const { data: property } = await supabase
    .from("properties")
    .select("slug")
    .eq("id", review.property_id)
    .maybeSingle();
  const { error } = await supabase.from("reviews").delete().eq("id", review.id);
  if (error) return;

  if (property) revalidatePath(`/properties/${property.slug}`);
}
