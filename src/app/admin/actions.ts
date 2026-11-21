"use server";

import { revalidatePath } from "next/cache";
import { isAdminRole, isSuperAdminRole, requireAdmin, requireSuperAdmin } from "@/lib/auth/guards";
import { storageBucket } from "@/lib/config";
import { persistProperty } from "@/lib/properties/save-property";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { getDestinationImageStoragePath } from "@/lib/utils";
import { recordAdminAudit } from "@/lib/security/audit";
import {
  adminReviewReportActionSchema,
  categorySchema,
  destinationSchema,
  enquiryResponseSchema,
  parseOptional,
  planSchema,
  schemaFieldErrors,
} from "@/lib/validations";
import type { ActionResult } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EnquiryRow, EnquiryStatus } from "@/types/database.types";

type Client = SupabaseClient<Database>;

async function client(): Promise<Client | null> {
  return (getAdminClient() as Client | null) ?? (await getServerClient());
}

function revalidateAdmin() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/destinations");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/settings");
  revalidatePath("/properties");
  revalidatePath("/destinations");
}

function destinationDatabaseError(action: string, message: string) {
  if (message.toLowerCase().includes("permission denied")) {
    return `You do not have permission to ${action} this destination.`;
  }
  return message;
}

async function activeSuperAdminCount(supabase: Client) {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("account_status", "active");
  return count ?? 0;
}

export async function setPropertyStatusAction(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("propertyId"));
  const status = parseOptional(formData.get("status"));
  if (!id || (status !== "approved" && status !== "rejected")) return;

  const reason = parseOptional(formData.get("reason"));
  if (status === "rejected" && !reason) return;

  await supabase
    .from("properties")
    .update({
      status,
      rejection_reason: status === "rejected" ? reason : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: status === "approved" ? "property.approved" : "property.rejected",
    targetTable: "properties",
    targetId: id,
    metadata: { reason: reason ?? null },
  });
  revalidateAdmin();
}

export async function toggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("propertyId"));
  const featured = parseOptional(formData.get("featured")) === "true";
  if (!id) return;
  await supabase.from("properties").update({ is_featured: !featured }).eq("id", id);
  revalidateAdmin();
}

export async function deletePropertyAdminAction(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("propertyId"));
  if (!id) return;
  const admin = getAdminClient();
  const { data: images } = await supabase
    .from("property_images")
    .select("storage_path")
    .eq("property_id", id);
  if (admin && images?.length) {
    await admin.storage.from(storageBucket).remove(images.map((image) => image.storage_path));
  }
  await supabase.from("property_images").delete().eq("property_id", id);
  await supabase.from("properties").delete().eq("id", id);
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: "property.deleted",
    targetTable: "properties",
    targetId: id,
    metadata: { removedImages: images?.length ?? 0 },
  });
  revalidateAdmin();
}

function requestedStatus(formData: FormData) {
  const value = parseOptional(formData.get("status"));
  return value === "draft" || value === "pending" || value === "approved" || value === "rejected"
    ? value
    : undefined;
}

export async function createPropertyAdminAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile } = await requireAdmin();
  const submittedOwnerId = parseOptional(formData.get("ownerId"));
  if (submittedOwnerId && submittedOwnerId !== user.id && !isSuperAdminRole(profile?.role)) {
    return { ok: false, message: "Only a super admin can assign a listing to another owner." };
  }
  return persistProperty({
    formData,
    actorId: user.id,
    adminMode: true,
    statusOverride: requestedStatus(formData),
  });
}

export async function savePropertyAdminAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile } = await requireAdmin();
  const propertyId = parseOptional(formData.get("propertyId"));
  if (!propertyId) {
    return { ok: false, message: "Property not found." };
  }
  const submittedOwnerId = parseOptional(formData.get("ownerId"));
  if (submittedOwnerId && !isSuperAdminRole(profile?.role)) {
    const supabase = await client();
    const { data: existing } = supabase
      ? await supabase.from("properties").select("owner_id").eq("id", propertyId).maybeSingle()
      : { data: null };
    if (!existing || existing.owner_id !== submittedOwnerId) {
      return { ok: false, message: "Only a super admin can change a listing owner." };
    }
  }
  return persistProperty({ formData, actorId: user.id, adminMode: true });
}

export async function changePropertyOwnerAdminAction(formData: FormData) {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await client();
  if (!supabase) return;
  const propertyId = parseOptional(formData.get("propertyId"));
  const ownerId = parseOptional(formData.get("ownerId"));
  if (!propertyId || !ownerId) return;

  const { data: owner } = await supabase.from("profiles").select("id").eq("id", ownerId).maybeSingle();
  if (!owner) return;

  const { error } = await supabase
    .from("properties")
    .update({ owner_id: ownerId })
    .eq("id", propertyId);
  if (error) return;
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: "property.owner_changed",
    targetTable: "properties",
    targetId: propertyId,
    metadata: { ownerId },
  });
  revalidateAdmin();
}

export async function setCoverImageAdminAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  const admin = getAdminClient();
  if (!supabase || !admin) return;

  const propertyId = parseOptional(formData.get("propertyId"));
  const imageId = parseOptional(formData.get("imageId"));
  if (!propertyId || !imageId) return;

  const { data: images } = await supabase
    .from("property_images")
    .select("id,is_cover")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  const chosen = images?.find((image) => image.id === imageId);
  if (!chosen || chosen.is_cover) return;

  const others = (images ?? []).filter((image) => image.id !== imageId);
  if (others[0]) {
    await supabase
      .from("property_images")
      .update({ is_cover: false, position: 1 })
      .eq("id", others[0].id);
  }
  await supabase
    .from("property_images")
    .update({ is_cover: true, position: 0 })
    .eq("id", imageId);
  for (let index = 1; index < others.length; index += 1) {
    await supabase
      .from("property_images")
      .update({ position: index + 1 })
      .eq("id", others[index].id);
  }
  revalidateAdmin();
}

export async function deleteImageAdminAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;

  const propertyId = parseOptional(formData.get("propertyId"));
  const imageId = parseOptional(formData.get("imageId"));
  if (!propertyId || !imageId) return;

  const { data: image } = await supabase
    .from("property_images")
    .select("id,storage_path,is_cover")
    .eq("id", imageId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!image) return;

  const admin = getAdminClient();
  if (admin) await admin.storage.from(storageBucket).remove([image.storage_path]);
  await supabase.from("property_images").delete().eq("id", image.id);

  if (image.is_cover) {
    const { data: next } = await supabase
      .from("property_images")
      .select("id")
      .eq("property_id", propertyId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("property_images").update({ is_cover: true }).eq("id", next.id);
  }
  revalidateAdmin();
}

export async function setUserRoleAction(formData: FormData) {
  const { user, profile } = await requireSuperAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("userId"));
  const role = parseOptional(formData.get("role"));
  const allowedRoles = ["user", "owner", "admin", "super_admin"];
  if (!id || id === user.id || !allowedRoles.includes(role ?? "")) return;

  const { data: target } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", id)
    .maybeSingle();
  if (!target || isAdminRole(target.role) && !isSuperAdminRole(profile?.role)) return;

  if (target.role === "super_admin" && role !== "super_admin" && (await activeSuperAdminCount(supabase)) <= 1) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ role: role as "user" | "owner" | "admin" | "super_admin" })
    .eq("id", id);
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: "user.role_changed",
    targetTable: "profiles",
    targetId: id,
    metadata: { from: target.role, to: role, targetEmail: target.email },
  });
  revalidateAdmin();
}

export async function setUserStatusAction(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("userId"));
  const status = parseOptional(formData.get("status"));
  if (!id || id === user.id || (status !== "active" && status !== "suspended")) return;

  const { data: target } = await supabase
    .from("profiles")
    .select("role,email,account_status")
    .eq("id", id)
    .maybeSingle();
  if (!target) return;

  if (isAdminRole(target.role) && !isSuperAdminRole(profile?.role)) return;
  if (target.role === "super_admin" && status === "suspended" && (await activeSuperAdminCount(supabase)) <= 1) {
    return;
  }

  await supabase.from("profiles").update({ account_status: status }).eq("id", id);
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: "user.status_changed",
    targetTable: "profiles",
    targetId: id,
    metadata: { from: target.account_status, to: status, targetEmail: target.email },
  });
  revalidateAdmin();
}

export async function savePlanAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, profile } = await requireAdmin();
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Database not configured." };
  const id = parseOptional(formData.get("planId"));
  if (!id) return { ok: false, message: "Plan not found." };

  const parsed = planSchema.safeParse({
    price_monthly: formData.get("price_monthly"),
    price_yearly: formData.get("price_yearly"),
    max_properties: formData.get("max_properties"),
    max_images_per_property: formData.get("max_images_per_property"),
    expired_listing_visibility: formData.get("expired_listing_visibility"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const { error } = await supabase
    .from("plans")
    .update({
      price_monthly: parsed.data.price_monthly,
      price_yearly: parsed.data.price_yearly,
      max_properties: parsed.data.max_properties,
      max_images_per_property: parsed.data.max_images_per_property,
      expired_listing_visibility: parsed.data.expired_listing_visibility,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: "plan.updated",
    targetTable: "plans",
    targetId: id,
    metadata: parsed.data as unknown as Record<string, unknown>,
  });
  revalidateAdmin();
  return { ok: true, message: "Plan settings updated." };
}

export async function saveDestinationAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Database not configured." };
  const id = parseOptional(formData.get("destinationId"));
  const name = parseOptional(formData.get("name"));
  if (!name) return { ok: false, message: "Destination name is required." };

  const parsed = destinationSchema.safeParse({
    name,
    slug: parseOptional(formData.get("slug")) ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    state: parseOptional(formData.get("state")) ?? "Kerala",
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    image_url: formData.get("image_url"),
    seo_title: formData.get("seo_title"),
    seo_description: formData.get("seo_description"),
    is_active: formData.get("is_active") === "on",
    sort_order: formData.get("sort_order") ?? 0,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    state: parsed.data.state,
    short_description: parseOptional(parsed.data.short_description),
    description: parseOptional(parsed.data.description),
    image_url: parseOptional(parsed.data.image_url),
    seo_title: parseOptional(parsed.data.seo_title),
    seo_description: parseOptional(parsed.data.seo_description),
    is_active: parsed.data.is_active,
    sort_order: parsed.data.sort_order,
  };

  let previousImageUrl: string | null = null;
  if (id) {
    const { data: existing, error: lookupError } = await supabase
      .from("destinations")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) {
      return {
        ok: false,
        message: `Unable to load destination: ${destinationDatabaseError("edit", lookupError.message)}`,
      };
    }
    if (!existing) return { ok: false, message: "Destination not found." };
    previousImageUrl = existing.image_url;
  }

  const { error } = id
    ? await supabase.from("destinations").update(payload).eq("id", id)
    : await supabase.from("destinations").insert(payload);
  if (error) {
    const action = id ? "update" : "add";
    return {
      ok: false,
      message: `Unable to ${action} destination: ${destinationDatabaseError(action, error.message)}`,
    };
  }

  if (previousImageUrl && previousImageUrl !== payload.image_url) {
    const previousPath = getDestinationImageStoragePath(previousImageUrl);
    if (previousPath) await supabase.storage.from(storageBucket).remove([previousPath]);
  }

  revalidateAdmin();
  return { ok: true, message: id ? "Destination updated." : "Destination added." };
}

export async function deleteDestinationAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("destinationId"));
  if (!id) return;

  const { data: destination } = await supabase
    .from("destinations")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (!destination) return;

  const { error } = await supabase.from("destinations").delete().eq("id", id);
  if (error) return;

  const imagePath = getDestinationImageStoragePath(destination.image_url);
  if (imagePath) await supabase.storage.from(storageBucket).remove([imagePath]);
  revalidateAdmin();
}

export async function saveCategoryAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Database not configured." };
  const id = parseOptional(formData.get("categoryId"));
  const name = parseOptional(formData.get("name"));
  if (!name) return { ok: false, message: "Category name is required." };

  const parsed = categorySchema.safeParse({
    name,
    slug: parseOptional(formData.get("slug")) ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    is_active: formData.get("is_active") === "on",
    sort_order: formData.get("sort_order") ?? 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parseOptional(parsed.data.description),
    icon: parseOptional(parsed.data.icon),
    is_active: parsed.data.is_active,
    sort_order: parsed.data.sort_order,
  };
  const result = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert(payload);
  if (result.error) return { ok: false, message: result.error.message };
  revalidateAdmin();
  return { ok: true, message: id ? "Category updated." : "Category added." };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("categoryId"));
  if (!id) return;
  await supabase.from("categories").delete().eq("id", id);
  revalidateAdmin();
}

export async function addAmenityAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const name = parseOptional(formData.get("name"));
  if (!name) return;
  await supabase.from("amenities").insert({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  });
  revalidateAdmin();
}

const enquiryStatuses = ["new", "read", "replied", "contacted", "pending", "completed"] as const;

export async function markEnquiryAdminAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("enquiryId"));
  const status = parseOptional(formData.get("status"));
  if (!id || !status || !enquiryStatuses.includes(status as EnquiryStatus)) return;
  await supabase.from("enquiries").update({ status: status as EnquiryStatus }).eq("id", id);
  revalidateAdmin();
}

export async function respondToEnquiryAdminAction(formData: FormData) {
  await requireAdmin();
  const parsed = enquiryResponseSchema.safeParse({
    enquiry_id: formData.get("enquiry_id"),
    status: formData.get("status"),
    response_message: formData.get("response_message"),
    quoted_amount: formData.get("quoted_amount"),
    quote_currency: formData.get("quote_currency"),
  });
  if (!parsed.success) return;
  const supabase = await client();
  if (!supabase) return;

  const hasResponse = Boolean(parsed.data.response_message) || Boolean(parsed.data.quoted_amount);
  const update: Partial<EnquiryRow> = {
    status: parsed.data.status,
    response_message: parsed.data.response_message || null,
    quoted_amount:
      parsed.data.quoted_amount === "" || parsed.data.quoted_amount === undefined
        ? null
        : parsed.data.quoted_amount,
    quote_currency: parsed.data.quote_currency || "INR",
  };
  if (hasResponse) update.responded_at = new Date().toISOString();

  await supabase.from("enquiries").update(update).eq("id", parsed.data.enquiry_id);
  revalidateAdmin();
}

export async function deleteEnquiryAdminAction(formData: FormData) {
  await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("enquiryId"));
  if (!id) return;
  await supabase.from("enquiries").delete().eq("id", id);
  revalidateAdmin();
}

export async function moderateReviewAction(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("reviewId"));
  const status = parseOptional(formData.get("status"));
  if (!id || (status !== "approved" && status !== "rejected")) return;
  await supabase.from("reviews").update({ status }).eq("id", id);
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: status === "approved" ? "review.approved" : "review.rejected",
    targetTable: "reviews",
    targetId: id,
  });
  revalidateAdmin();
}

export async function deleteReviewAdminAction(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const supabase = await client();
  if (!supabase) return;
  const id = parseOptional(formData.get("reviewId"));
  if (!id) return;
  await supabase.from("reviews").delete().eq("id", id);
  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: "review.deleted",
    targetTable: "reviews",
    targetId: id,
  });
  revalidateAdmin();
}

export async function resolveReviewReportAction(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const parsed = adminReviewReportActionSchema.safeParse({
    reportId: formData.get("reportId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  const supabase = await client();
  if (!supabase) return;
  const { data: report } = await supabase
    .from("review_reports")
    .select("review_id")
    .eq("id", parsed.data.reportId)
    .maybeSingle();
  if (!report) return;

  if (parsed.data.decision === "actioned") {
    await supabase.from("reviews").update({ status: "rejected" }).eq("id", report.review_id);
  }
  await supabase
    .from("review_reports")
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId);

  await recordAdminAudit({
    actorId: user.id,
    actorEmail: profile?.email ?? user.email ?? null,
    action: `review_report.${parsed.data.decision}`,
    targetTable: "review_reports",
    targetId: parsed.data.reportId,
    metadata: { reviewId: report.review_id },
  });
  revalidateAdmin();
}
