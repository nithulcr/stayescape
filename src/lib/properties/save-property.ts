import "server-only";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { canCreateProperty } from "@/lib/plans/property-limits";
import { getServerClient } from "@/lib/supabase/server";
import { parseOptional, propertySchema, schemaFieldErrors } from "@/lib/validations";
import { uniqueSlug } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { PropertyRow, PropertyStatus } from "@/types/database.types";

function listFromForm(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidatePropertyPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
}

export type PersistPropertyOptions = {
  formData: FormData;
  actorId: string;
  adminMode?: boolean;
  statusOverride?: PropertyStatus;
};

export async function persistProperty({
  formData,
  actorId,
  adminMode = false,
  statusOverride,
}: PersistPropertyOptions): Promise<ActionResult> {
  const parsed = propertySchema.safeParse({
    name: formValue(formData, "property_name"),
    short_description: formValue(formData, "property_short_description"),
    state: formValue(formData, "property_state"),
    district: formValue(formData, "property_district"),
    destination_id: formValue(formData, "property_destination_id"),
    category_id: formValue(formData, "property_category_id"),
    description: formValue(formData, "property_description"),
    address: formValue(formData, "property_address"),
    map_url: formValue(formData, "property_map_url"),
    price_per_night: formValue(formData, "property_price_per_night"),
    amenities: listFromForm(formData, "property_amenities"),
    contact_phone: formValue(formData, "property_contact_phone"),
    whatsapp_number: formValue(formData, "property_whatsapp_number"),
    contact_email: formValue(formData, "property_contact_email"),
    website_url: formValue(formData, "property_website_url"),
    instagram_url: formValue(formData, "property_instagram_url"),
    facebook_url: formValue(formData, "property_facebook_url"),
    check_in_time: formValue(formData, "property_check_in_time"),
    check_out_time: formValue(formData, "property_check_out_time"),
    highlights: formValue(formData, "property_highlights"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const values = parsed.data;
  const propertyId = parseOptional(formData.get("propertyId"));
  const serverSupabase = await getServerClient();
  if (!serverSupabase) return { ok: false, message: "Database not configured." };
  const supabase = adminMode ? (getAdminClient() ?? serverSupabase) : serverSupabase;

  let ownerId = actorId;
  if (adminMode) {
    ownerId = parseOptional(formData.get("ownerId")) ?? actorId;
    const { data: owner } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner) return { ok: false, message: "The selected property owner does not exist." };
  }

  let existing: { id: string; owner_id: string; slug: string } | null = null;
  if (propertyId) {
    let query = supabase.from("properties").select("id,owner_id,slug").eq("id", propertyId);
    if (!adminMode) query = query.eq("owner_id", actorId);
    const { data } = await query.maybeSingle();
    if (!data) return { ok: false, message: "Property not found." };
    existing = data;
    if (adminMode) ownerId = parseOptional(formData.get("ownerId")) ?? data.owner_id;
  }

  const plan = await getPlanContextForUser(ownerId);
  const isNewListing = !existing || existing.owner_id !== ownerId;

  if (isNewListing) {
    let currentPropertyCount = 0;
    if (!plan.isUnlimited) {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", ownerId);
      currentPropertyCount = count ?? 0;
    }
    if (!canCreateProperty(currentPropertyCount, plan)) {
      const noun = plan.limits.maxProperties === 1 ? "property" : "properties";
      return {
        ok: false,
        message: `Your ${plan.limits.planName} plan allows ${plan.limits.maxProperties} ${noun}. Upgrade to add more.`,
      };
    }
  }

  const payload: Partial<PropertyRow> = {
    name: values.name,
    short_description: values.short_description,
    state: values.state,
    district: values.district || null,
    destination_id: values.destination_id,
    category_id: values.category_id,
  };

  if (plan.isPremium) {
    Object.assign(payload, {
      description: parseOptional(values.description),
      address: parseOptional(values.address),
      map_url: parseOptional(values.map_url),
      price_per_night: values.price_per_night === "" || values.price_per_night === undefined
        ? null
        : Number(values.price_per_night),
      contact_phone: parseOptional(values.contact_phone),
      whatsapp_number: parseOptional(values.whatsapp_number),
      contact_email: parseOptional(values.contact_email),
      website_url: parseOptional(values.website_url),
      instagram_url: parseOptional(values.instagram_url),
      facebook_url: parseOptional(values.facebook_url),
      check_in_time: parseOptional(values.check_in_time),
      check_out_time: parseOptional(values.check_out_time),
      highlights: (values.highlights ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 20),
    });
  }

  if (adminMode) {
    payload.owner_id = ownerId;
    payload.is_featured = formData.get("is_featured") === "on";
    const statusValue = parseOptional(formData.get("status"));
    if (
      statusValue === "draft" ||
      statusValue === "pending" ||
      statusValue === "approved" ||
      statusValue === "rejected"
    ) {
      payload.status = statusValue;
    }
  }

  let savedId: string;
  if (existing) {
    const { error } = await supabase.from("properties").update(payload).eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
    savedId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        ...payload,
        owner_id: ownerId,
        name: values.name,
        slug: uniqueSlug(values.name),
        status: statusOverride ?? "pending",
        submitted_at: new Date().toISOString(),
      })
      .select("id,owner_id")
      .single();
    if (error) return { ok: false, message: error.message };
    if (!data) return { ok: false, message: "Property could not be created." };
    if (data.owner_id !== ownerId) {
      await supabase.from("properties").delete().eq("id", data.id);
      return { ok: false, message: "Ownership mapping failed. Please try again." };
    }
    savedId = data.id;
  }

  if (plan.isPremium) {
    await supabase.from("property_amenities").delete().eq("property_id", savedId);
    if (values.amenities?.length) {
      const { error } = await supabase.from("property_amenities").insert(
        values.amenities.map((amenityId) => ({ property_id: savedId, amenity_id: amenityId })),
      );
      if (error) return { ok: false, message: error.message };
    }
  }

  revalidatePropertyPaths();
  return {
    ok: true,
    message: existing
      ? "Property updated."
      : adminMode
        ? "Property created from the admin console."
        : "Property submitted for review.",
    propertyId: savedId,
  };
}
