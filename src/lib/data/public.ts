import "server-only";

import { getServerClient } from "@/lib/supabase/server";
import { fallbackPropertyImage } from "@/lib/media";
import { slugify } from "@/lib/utils";
import type {
  AmenityRow,
  CategoryRow,
  DestinationRow,
  PropertyImageRow,
  PropertyRow,
  ReviewRow,
} from "@/types/database.types";
import type {
  PropertyAmenity,
  PropertyCardImage,
  PropertyDetail,
  PropertyFilters,
  PropertyListItem,
  PropertyReview,
  ReviewSummary,
} from "@/types";

type SupabaseServer = NonNullable<Awaited<ReturnType<typeof getServerClient>>>;

type Lookups = {
  categories: Map<string, CategoryRow>;
  destinations: Map<string, DestinationRow>;
};

async function getLookups(supabase: SupabaseServer): Promise<Lookups> {
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

async function getImagesForProperties(
  supabase: SupabaseServer,
  propertyIds: string[],
) {
  if (!propertyIds.length) return new Map<string, PropertyImageRow[]>();
  const { data } = await supabase
    .from("property_images")
    .select("*")
    .in("property_id", propertyIds)
    .order("position", { ascending: true });
  const grouped = new Map<string, PropertyImageRow[]>();
  for (const image of (data ?? []) as PropertyImageRow[]) {
    grouped.set(image.property_id, [...(grouped.get(image.property_id) ?? []), image]);
  }
  return grouped;
}

async function getAmenitiesForProperties(
  supabase: SupabaseServer,
  propertyIds: string[],
) {
  if (!propertyIds.length) return new Map<string, PropertyAmenity[]>();
  const { data: links } = await supabase
    .from("property_amenities")
    .select("property_id,amenity_id")
    .in("property_id", propertyIds);
  const amenityIds = [...new Set((links ?? []).map((link) => link.amenity_id))];
  if (!amenityIds.length) return new Map<string, PropertyAmenity[]>();

  const { data } = await supabase.from("amenities").select("*").in("id", amenityIds);
  const amenityMap = new Map(
    ((data ?? []) as AmenityRow[]).map((amenity) => [
      amenity.id,
      { id: amenity.id, name: amenity.name, icon: amenity.icon } satisfies PropertyAmenity,
    ]),
  );
  const grouped = new Map<string, PropertyAmenity[]>();
  for (const link of links ?? []) {
    const amenity = amenityMap.get(link.amenity_id);
    if (!amenity) continue;
    grouped.set(link.property_id, [...(grouped.get(link.property_id) ?? []), amenity]);
  }
  return grouped;
}

type ReviewStat = { property_id: string; average: number; count: number };

function summarizeStats(rows: { property_id: string; rating: number }[]): ReviewStat[] {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const current = totals.get(row.property_id) ?? { sum: 0, count: 0 };
    totals.set(row.property_id, { sum: current.sum + row.rating, count: current.count + 1 });
  }
  return [...totals.entries()].map(([property_id, value]) => ({
    property_id,
    average: Math.round((value.sum / value.count) * 10) / 10,
    count: value.count,
  }));
}

async function getReviewStats(
  supabase: SupabaseServer,
  propertyIds: string[],
): Promise<Map<string, ReviewStat>> {
  if (!propertyIds.length) return new Map();
  const { data } = await supabase
    .from("reviews")
    .select("property_id,rating")
    .eq("status", "approved")
    .in("property_id", propertyIds);
  return new Map(
    summarizeStats((data ?? []) as { property_id: string; rating: number }[]).map((stat) => [
      stat.property_id,
      stat,
    ]),
  );
}

function toListItem(
  property: PropertyRow,
  lookups: Lookups,
  images: PropertyImageRow[],
  amenities: PropertyAmenity[],
  review: ReviewSummary,
): PropertyListItem {
  const cover = images.find((image) => image.is_cover) ?? images[0];
  const destination = property.destination_id ? lookups.destinations.get(property.destination_id) : null;
  const category = property.category_id ? lookups.categories.get(property.category_id) : null;
  const cardImages: PropertyCardImage[] = images.map((image) => ({
    id: image.id,
    public_url: image.public_url,
    alt_text: image.alt_text,
    is_cover: image.is_cover,
  }));
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
    state: destination?.state ?? null,
    category_name: category?.name ?? null,
    category_slug: category?.slug ?? null,
    cover_image: cover?.public_url || fallbackPropertyImage,
    image_count: images.length,
    images: cardImages,
    amenities,
    rating_average: review.average,
    review_count: review.count,
    created_at: property.created_at,
  };
}

function sanitizeSearch(value: string | undefined) {
  return (value ?? "").replace(/[%_,()\\.*'"]/g, "").trim().slice(0, 80);
}

export async function getPublishedProperties(
  filters: PropertyFilters = {},
  pageSize = 9,
): Promise<{ items: PropertyListItem[]; total: number }> {
  const supabase = await getServerClient();
  if (!supabase) return { items: [], total: 0 };

  try {
    const lookups = await getLookups(supabase);
    let query = supabase.from("properties").select("*", { count: "exact" }).eq("status", "approved");

    const search = sanitizeSearch(filters.q);
    if (search) {
      const needle = search.toLowerCase();
      const destinationIds = [...lookups.destinations.values()]
        .filter(
          (item) =>
            item.slug.toLowerCase().includes(needle) ||
            item.name.toLowerCase().includes(needle) ||
            item.state.toLowerCase().includes(needle),
        )
        .map((item) => item.id);
      query = destinationIds.length
        ? query.or(`name.ilike.*${search}*,destination_id.in.(${destinationIds.join(",")})`)
        : query.ilike("name", `%${search}%`);
    }

    if (filters.destination) {
      const requested = filters.destination.trim().toLowerCase();
      const destination = [...lookups.destinations.values()].find(
        (item) =>
          item.slug.toLowerCase() === requested ||
          slugify(item.name) === requested ||
          item.name.trim().toLowerCase() === requested,
      );
      if (!destination) return { items: [], total: 0 };
      query = query.eq("destination_id", destination.id);
    }

    if (filters.category) {
      const category = [...lookups.categories.values()].find(
        (item) => item.slug === filters.category,
      );
      if (!category) return { items: [], total: 0 };
      query = query.eq("category_id", category.id);
    }

    if (typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice)) {
      query = query.gte("price_per_night", filters.minPrice);
    }
    if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) {
      query = query.lte("price_per_night", filters.maxPrice);
    }

    if (filters.amenity?.length) {
      const { data: amenityLinks } = await supabase
        .from("property_amenities")
        .select("property_id")
        .in("amenity_id", filters.amenity);
      const matchingIds = [
        ...new Set((amenityLinks ?? []).map((link) => link.property_id)),
      ];
      if (!matchingIds.length) return { items: [], total: 0 };
      query = query.in("id", matchingIds);
    }

    if (filters.sort === "price_low") query = query.order("price_per_night", { ascending: true });
    else if (filters.sort === "price_high") query = query.order("price_per_night", { ascending: false });
    else if (filters.sort === "featured") query = query.order("is_featured", { ascending: false });
    query = query.order("created_at", { ascending: false });

    const page = Math.max(1, Number(filters.page) || 1);
    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);
    if (error) return { items: [], total: 0 };

    const properties = (data ?? []) as PropertyRow[];
    const propertyIds = properties.map((property) => property.id);
    const [images, amenities, reviews] = await Promise.all([
      getImagesForProperties(supabase, propertyIds),
      getAmenitiesForProperties(supabase, propertyIds),
      getReviewStats(supabase, propertyIds),
    ]);
    return {
      items: properties.map((property) =>
        toListItem(
          property,
          lookups,
          images.get(property.id) ?? [],
          amenities.get(property.id) ?? [],
          reviews.get(property.id) ?? { average: null, count: 0 },
        ),
      ),
      total: count ?? properties.length,
    };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getFeaturedProperties(limit = 6): Promise<PropertyListItem[]> {
  const { items } = await getPublishedProperties({ sort: "featured" }, limit);
  const featured = items.filter((item) => item.is_featured);
  return featured.length ? featured : items;
}

export async function getRecentlyAddedProperties(limit = 3): Promise<PropertyListItem[]> {
  const { items } = await getPublishedProperties({ sort: "newest" }, limit);
  return items;
}

export async function getTopRatedProperties(limit = 6, minimumReviews = 3): Promise<PropertyListItem[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("reviews")
      .select("property_id,rating")
      .eq("status", "approved");
    const stats = summarizeStats((data ?? []) as { property_id: string; rating: number }[]);
    const qualified = stats
      .filter((stat) => stat.count >= minimumReviews)
      .sort((a, b) => b.average - a.average || b.count - a.count)
      .slice(0, limit);

    if (!qualified.length) return getFeaturedProperties(limit);

    const propertyIds = qualified.map((stat) => stat.property_id);
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .in("id", propertyIds)
      .eq("status", "approved");
    const propertyMap = new Map(
      ((propertyData ?? []) as PropertyRow[]).map((property) => [property.id, property]),
    );
    const properties = propertyIds
      .map((id) => propertyMap.get(id))
      .filter((property): property is PropertyRow => Boolean(property));
    if (!properties.length) return getFeaturedProperties(limit);

    const [lookups, images, amenities] = await Promise.all([
      getLookups(supabase),
      getImagesForProperties(supabase, propertyIds),
      getAmenitiesForProperties(supabase, propertyIds),
    ]);
    const statMap = new Map(qualified.map((stat) => [stat.property_id, stat]));
    return properties.map((property) =>
      toListItem(
        property,
        lookups,
        images.get(property.id) ?? [],
        amenities.get(property.id) ?? [],
        statMap.get(property.id) ?? { average: null, count: 0 },
      ),
    );
  } catch {
    return getFeaturedProperties(limit);
  }
}

export async function getPropertyReviews(
  propertyId: string,
  viewerId?: string | null,
  guestToken?: string | null,
): Promise<PropertyReview[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const conditions = ["status.eq.approved"];
  if (viewerId) conditions.push(`user_id.eq.${viewerId}`);
  if (guestToken) conditions.push(`guest_token.eq.${guestToken}`);

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("property_id", propertyId)
    .or(conditions.join(","))
    .order("created_at", { ascending: false });

  return ((data ?? []) as ReviewRow[]).map((review) => ({
    id: review.id,
    property_id: review.property_id,
    user_id: review.user_id,
    guest_token: review.guest_token,
    reviewer_name: review.reviewer_name,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    status: review.status,
    created_at: review.created_at,
    author_label:
      (viewerId && review.user_id === viewerId) || (guestToken && review.guest_token === guestToken)
        ? "You"
        : review.reviewer_name ?? "Guest traveller",
  }));
}

export function summarizeReviews(reviews: PropertyReview[]): ReviewSummary {
  if (!reviews.length) return { average: null, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}

export async function getPropertyBySlug(
  slug: string,
  viewerId?: string | null,
  guestToken?: string | null,
): Promise<PropertyDetail | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    const property = data as PropertyRow | null;
    if (!property) return null;

    const lookups = await getLookups(supabase);
    const [imageResult, amenityLinks, ownerResult] = await Promise.all([
      supabase
        .from("property_images")
        .select("*")
        .eq("property_id", property.id)
        .order("position", { ascending: true }),
      supabase.from("property_amenities").select("amenity_id").eq("property_id", property.id),
      supabase
        .from("public_property_owners")
        .select("id, full_name, avatar_url, phone, whatsapp_number")
        .eq("id", property.owner_id)
        .maybeSingle(),
    ]);

    const amenityIds = (amenityLinks.data ?? []).map((link) => link.amenity_id);
    let amenities: PropertyAmenity[] = [];
    if (amenityIds.length) {
      const { data: amenityData } = await supabase
        .from("amenities")
        .select("*")
        .in("id", amenityIds);
      amenities = ((amenityData ?? []) as AmenityRow[]).map((amenity) => ({
        id: amenity.id,
        name: amenity.name,
        icon: amenity.icon,
      }));
    }

    const images = (imageResult.data ?? []) as PropertyImageRow[];
    const reviews = await getPropertyReviews(property.id, viewerId, guestToken);
    const summary = summarizeReviews(reviews);
    const base = toListItem(property, lookups, images, amenities, summary);
    return {
      ...base,
      description: property.description,
      address: property.address,
      latitude: property.latitude ? Number(property.latitude) : null,
      longitude: property.longitude ? Number(property.longitude) : null,
      map_url: property.map_url,
      contact_phone: property.contact_phone,
      whatsapp_number: property.whatsapp_number,
      contact_email: property.contact_email,
      website_url: property.website_url,
      instagram_url: property.instagram_url,
      facebook_url: property.facebook_url,
      check_in_time: property.check_in_time,
      check_out_time: property.check_out_time,
      highlights: Array.isArray(property.highlights) ? property.highlights : [],
      owner_id: property.owner_id,
      owner_name: ownerResult.data?.full_name ?? null,
      owner_avatar: ownerResult.data?.avatar_url ?? null,
      owner_phone: ownerResult.data?.phone ?? null,
      owner_whatsapp: ownerResult.data?.whatsapp_number ?? null,
      reviews,
    };
  } catch {
    return null;
  }
}

export async function getSimilarProperties(
  property: Pick<PropertyDetail, "id" | "city" | "category_slug">,
  limit = 3,
): Promise<PropertyListItem[]> {
  const { items } = await getPublishedProperties(
    { destination: property.city ? cityToSlug(property.city) : undefined, page: 1 },
    12,
  );
  return items.filter((item) => item.id !== property.id).slice(0, limit);
}

function cityToSlug(city: string) {
  return city.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function getDestinations(): Promise<DestinationRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("destinations")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as DestinationRow[];
}

export async function getDestinationBySlug(slug: string): Promise<DestinationRow | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as DestinationRow | null) ?? null;
}

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as CategoryRow[];
}

export async function getAllAmenities(): Promise<AmenityRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from("amenities").select("*").order("name");
  return (data ?? []) as AmenityRow[];
}
