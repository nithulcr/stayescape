import "server-only";

import { getServerClient } from "@/lib/supabase/server";
import { fallbackPropertyImage } from "@/lib/media";
import type {
  AmenityRow,
  CategoryRow,
  DestinationRow,
  EnquiryRow,
  PaymentRow,
  PropertyImageRow,
  PropertyRow,
  SubscriptionRow,
  PlanRow,
} from "@/types/database.types";
import type { PropertyAmenity, PropertyCardImage, PropertyListItem } from "@/types";

type SupabaseServer = NonNullable<Awaited<ReturnType<typeof getServerClient>>>;

async function ownerMaps(supabase: SupabaseServer) {
  const [categories, destinations] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("destinations").select("*"),
  ]);
  return {
    categories: new Map(((categories.data ?? []) as CategoryRow[]).map((item) => [item.id, item])),
    destinations: new Map(
      ((destinations.data ?? []) as DestinationRow[]).map((item) => [item.id, item]),
    ),
  };
}

export async function getOwnerProperties(userId: string): Promise<PropertyListItem[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  const properties = (data ?? []) as PropertyRow[];
  if (!properties.length) return [];

  const propertyIds = properties.map((property) => property.id);
  const [lookups, imageResult, amenityLinksResult, reviewResult] = await Promise.all([
    ownerMaps(supabase),
    supabase
      .from("property_images")
      .select("*")
      .in("property_id", propertyIds)
      .order("position", { ascending: true }),
    supabase.from("property_amenities").select("property_id,amenity_id").in("property_id", propertyIds),
    supabase
      .from("reviews")
      .select("property_id,rating")
      .eq("status", "approved")
      .in("property_id", propertyIds),
  ]);

  const imagesByProperty = new Map<string, PropertyImageRow[]>();
  for (const image of (imageResult.data ?? []) as PropertyImageRow[]) {
    imagesByProperty.set(image.property_id, [...(imagesByProperty.get(image.property_id) ?? []), image]);
  }

  const amenityIds = [...new Set((amenityLinksResult.data ?? []).map((link) => link.amenity_id))];
  const { data: amenityData } = amenityIds.length
    ? await supabase.from("amenities").select("*").in("id", amenityIds)
    : { data: [] as AmenityRow[] };
  const amenityMap = new Map(
    ((amenityData ?? []) as AmenityRow[]).map((amenity) => [amenity.id, amenity.name]),
  );
  const amenitiesByProperty = new Map<string, PropertyAmenity[]>();
  for (const link of amenityLinksResult.data ?? []) {
    const name = amenityMap.get(link.amenity_id);
    if (!name) continue;
    amenitiesByProperty.set(link.property_id, [
      ...(amenitiesByProperty.get(link.property_id) ?? []),
      { id: link.amenity_id, name, icon: null },
    ]);
  }

  const reviewStats = new Map<string, { sum: number; count: number }>();
  for (const review of reviewResult.data ?? []) {
    const current = reviewStats.get(review.property_id) ?? { sum: 0, count: 0 };
    reviewStats.set(review.property_id, {
      sum: current.sum + review.rating,
      count: current.count + 1,
    });
  }

  return properties.map((property) => {
    const images = imagesByProperty.get(property.id) ?? [];
    const cover = images.find((image) => image.is_cover) ?? images[0];
    const destination = property.destination_id ? lookups.destinations.get(property.destination_id) : null;
    const category = property.category_id ? lookups.categories.get(property.category_id) : null;
    const cardImages: PropertyCardImage[] = images.map((image) => ({
      id: image.id,
      public_url: image.public_url,
      alt_text: image.alt_text,
      is_cover: image.is_cover,
    }));
    const stats = reviewStats.get(property.id);
    return {
      id: property.id,
      name: property.name,
      slug: property.slug,
      short_description: property.short_description,
      status: property.status,
      is_featured: property.is_featured,
      plan_type: property.plan_type,
      price_per_night: property.price_per_night ? Number(property.price_per_night) : null,
      city: destination?.name ?? null,
      state: property.state || destination?.state || null,
      district: property.district ?? null,
      category_name: category?.name ?? null,
      category_slug: category?.slug ?? null,
      cover_image: cover?.public_url || fallbackPropertyImage,
      image_count: images.length,
      images: cardImages,
      amenities: amenitiesByProperty.get(property.id) ?? [],
      rating_average: stats ? Math.round((stats.sum / stats.count) * 10) / 10 : null,
      review_count: stats?.count ?? 0,
      created_at: property.created_at,
    };
  });
}

export type OwnerEnquiry = EnquiryRow & {
  property_name: string;
  property_slug: string;
};

export async function getOwnerEnquiries(userId: string): Promise<OwnerEnquiry[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const { data: properties } = await supabase
    .from("properties")
    .select("id,name,slug")
    .eq("owner_id", userId);
  const owned = (properties ?? []) as Pick<PropertyRow, "id" | "name" | "slug">[];
  if (!owned.length) return [];

  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .in(
      "property_id",
      owned.map((property) => property.id),
    )
    .order("created_at", { ascending: false });
  const names = new Map(owned.map((property) => [property.id, property]));

  return ((data ?? []) as EnquiryRow[]).map((enquiry) => ({
    ...enquiry,
    property_name: names.get(enquiry.property_id)?.name ?? "Property",
    property_slug: names.get(enquiry.property_id)?.slug ?? "",
  }));
}

export async function getOwnerStats(userId: string) {
  const properties = await getOwnerProperties(userId);
  const enquiries = await getOwnerEnquiries(userId);
  return {
    total: properties.length,
    published: properties.filter((property) => property.status === "approved").length,
    pending: properties.filter((property) => property.status === "pending").length,
    rejected: properties.filter((property) => property.status === "rejected").length,
    enquiries: enquiries.length,
  };
}

export async function getOwnerSubscription(userId: string) {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as (SubscriptionRow & { plan: PlanRow | null }) | null) ?? null;
}

export async function getOwnerPayments(userId: string): Promise<PaymentRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PaymentRow[];
}

export async function getPropertyImages(propertyId: string, ownerId: string) {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!property) return [];
  const { data } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  return (data ?? []) as PropertyImageRow[];
}
