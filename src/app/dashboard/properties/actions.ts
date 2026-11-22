"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/guards";
import { persistProperty } from "@/lib/properties/save-property";
import { getServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { storageBucket } from "@/lib/config";
import { enquiryResponseSchema, parseOptional } from "@/lib/validations";
import type { ActionResult } from "@/types";
import type { EnquiryRow } from "@/types/database.types";

export async function savePropertyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireOwner();
  return persistProperty({ formData, actorId: user.id });
}

export async function selectPublishedPropertyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireOwner();
  const propertyId = parseOptional(formData.get("propertyId"));
  if (!propertyId) return { ok: false, message: "Choose a property to publish." };

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Property service is unavailable." };

  const { data, error } = await supabase.rpc("select_expiry_property", {
    p_owner_id: user.id,
    p_property_id: propertyId,
  });
  const result = data as { ok?: boolean; message?: string } | null;
  if (error || !result?.ok) {
    return { ok: false, message: result?.message ?? "Unable to publish the selected property." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/properties");
  return { ok: true, message: "Published property updated." };
}

export async function setPropertyPublicationAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const propertyId = parseOptional(formData.get("propertyId"));
  const publish = parseOptional(formData.get("publish"));
  if (!propertyId || (publish !== "true" && publish !== "false")) {
    return { ok: false, message: "Invalid publication request." };
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Property service is unavailable." };

  const { data, error } = await supabase.rpc("set_property_published", {
    p_property_id: propertyId,
    p_published: publish === "true",
  });
  const result = data as { ok?: boolean; message?: string } | null;
  if (error || !result?.ok) {
    return { ok: false, message: result?.message ?? "Unable to update publication status." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/properties");
  return {
    ok: true,
    message: publish === "true" ? "Property published." : "Property unpublished.",
  };
}

export async function deletePropertyAction(formData: FormData) {
  const { user } = await requireOwner();
  const propertyId = parseOptional(formData.get("propertyId"));
  if (!propertyId) return;

  const supabase = await getServerClient();
  if (!supabase) return;

  const { data: property } = await supabase
    .from("properties")
    .select("id,slug")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!property) return;

  const admin = getAdminClient();
  const { data: images } = await supabase
    .from("property_images")
    .select("storage_path")
    .eq("property_id", propertyId);
  if (admin && images?.length) {
    await admin.storage.from(storageBucket).remove(images.map((image) => image.storage_path));
  }

  await supabase.from("property_images").delete().eq("property_id", propertyId);
  await supabase.from("properties").delete().eq("id", propertyId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath("/properties");
}

export async function setCoverImageAction(formData: FormData) {
  const { user } = await requireOwner();
  const propertyId = parseOptional(formData.get("propertyId"));
  const imageId = parseOptional(formData.get("imageId"));
  if (!propertyId || !imageId) return;

  const supabase = await getServerClient();
  if (!supabase) return;

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!property) return;

  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  const current = (images ?? []).filter((image) => image.id !== imageId);
  const cover = images?.find((image) => image.id === imageId);
  if (!cover) return;

  await supabase
    .from("property_images")
    .update({ is_cover: false, position: 1 })
    .eq("id", current[0]?.id ?? cover.id);
  await supabase
    .from("property_images")
    .update({ is_cover: true, position: 0 })
    .eq("id", imageId);

  if (current.length > 1) {
    await Promise.all(
      current.slice(1).map((image, index) =>
        supabase
          .from("property_images")
          .update({ is_cover: false, position: index + 2 })
          .eq("id", image.id),
      ),
    );
  }

  revalidatePath("/dashboard/properties");
  revalidatePath("/properties");
}

export async function deleteImageAction(formData: FormData) {
  const { user } = await requireOwner();
  const imageId = parseOptional(formData.get("imageId"));
  const propertyId = parseOptional(formData.get("propertyId"));
  if (!imageId || !propertyId) return;

  const supabase = await getServerClient();
  if (!supabase) return;

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!property) return;

  const { data: image } = await supabase
    .from("property_images")
    .select("id,storage_path,is_cover")
    .eq("id", imageId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!image) return;

  const admin = getAdminClient();
  if (admin) await admin.storage.from(storageBucket).remove([image.storage_path]);

  await supabase.from("property_images").delete().eq("id", imageId);

  if (image.is_cover) {
    const { data: remaining } = await supabase
      .from("property_images")
      .select("id")
      .eq("property_id", propertyId)
      .order("position", { ascending: true })
      .limit(1);
    if (remaining?.[0]) {
      await supabase
        .from("property_images")
        .update({ is_cover: true })
        .eq("id", remaining[0].id);
    }
  }

  revalidatePath("/dashboard/properties");
  revalidatePath("/properties");
}

const enquiryStatuses = ["new", "read", "replied", "contacted", "pending", "completed"] as const;

export async function markEnquiryAction(formData: FormData) {
  const { user } = await requireOwner();
  const enquiryId = parseOptional(formData.get("enquiryId"));
  const status = parseOptional(formData.get("status"));
  if (!enquiryId || !status || !enquiryStatuses.includes(status as (typeof enquiryStatuses)[number])) return;

  const supabase = await getServerClient();
  if (!supabase) return;

  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", user.id);
  const ids = (properties ?? []).map((property) => property.id);
  if (!ids.length) return;

  await supabase
    .from("enquiries")
    .update({ status: status as (typeof enquiryStatuses)[number] })
    .eq("id", enquiryId)
    .in("property_id", ids);

  revalidatePath("/dashboard/enquiries");
}

export async function respondToEnquiryAction(formData: FormData) {
  const { user } = await requireOwner();
  const parsed = enquiryResponseSchema.safeParse({
    enquiry_id: formData.get("enquiry_id"),
    status: formData.get("status"),
    response_message: formData.get("response_message"),
    quoted_amount: formData.get("quoted_amount"),
    quote_currency: formData.get("quote_currency"),
  });
  if (!parsed.success) return;

  const supabase = await getServerClient();
  if (!supabase) return;

  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", user.id);
  const ids = (properties ?? []).map((property) => property.id);
  if (!ids.length) return;

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

  await supabase
    .from("enquiries")
    .update(update)
    .eq("id", parsed.data.enquiry_id)
    .in("property_id", ids);

  revalidatePath("/dashboard/enquiries");
}
