import "server-only";

import { hasPropertyChangeRequestColumn, hasPropertyPublicationColumn } from "@/lib/supabase/schema";
import { getServerClient } from "@/lib/supabase/server";
import { districtOptions, isKeralaDistrict, keralaStateName, resolveDistrict } from "@/lib/config";
import { fallbackPropertyImage, getDistrictFallbackImage } from "@/lib/media";
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
  DistrictSummary,
  PropertyCardImage,
  PropertyDetail,
  PropertyFilters,
  PropertyListItem,
  PropertyReview,
  ReviewSummary,
} from "@/types";

const VISIBLE_PROPERTY_FILTER =
  "status.eq.approved,and(status.eq.pending,has_requested_changes.eq.true)";

function applyPublicPropertyVisibility<
  Query extends {
    or: (filters: string) => Query;
    eq: (column: string, value: string) => Query;
  },
>(query: Query, changeRequestReady: boolean): Query {
  return changeRequestReady ? query.or(VISIBLE_PROPERTY_FILTER) : query.eq("status", "approved");
}

type SupabaseServer = NonNullable<Awaited<ReturnType<typeof getServerClient>>>;

function limitImagesForPlan(images: PropertyImageRow[], limit: number): PropertyImageRow[] {
  const visibleLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
  return [...images]
    .sort((left, right) => left.position - right.position)
    .slice(0, visibleLimit);
}

type PublicPlanAccess = {
  imageLimit: number;
  allowsPremiumContent: boolean;
};

async function getPublicPlanAccess(
  supabase: SupabaseServer,
  ownerIds: string[],
): Promise<Map<string, PublicPlanAccess>> {
  const uniqueOwnerIds = [...new Set(ownerIds)];
  const entries = await Promise.all(
    uniqueOwnerIds.map(async (ownerId) => {
      const [imageLimitResult, premiumContentResult] = await Promise.all([
        supabase.rpc("public_image_limit_for_owner", { p_owner_id: ownerId }),
        supabase.rpc("public_allows_premium_content", { p_owner_id: ownerId }),
      ]);
      return [
        ownerId,
        {
          imageLimit: Number(imageLimitResult.data ?? 1),
          allowsPremiumContent: premiumContentResult.data === true,
        },
      ] as const;
    }),
  );
  return new Map(entries);
}

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
  planAccess: PublicPlanAccess = { imageLimit: 1, allowsPremiumContent: true },
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
    has_requested_changes: property.has_requested_changes ?? false,
    is_featured: planAccess.allowsPremiumContent && property.is_featured,
    is_published: property.is_published ?? true,
    publish_after_renewal: property.publish_after_renewal ?? false,
    plan_type: planAccess.allowsPremiumContent ? property.plan_type : "free",
    price_per_night:
      planAccess.allowsPremiumContent && property.price_per_night
        ? Number(property.price_per_night)
        : null,
    city: destination?.name ?? null,
    state: property.state || destination?.state || null,
    district: property.district ?? null,
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

function applyPublicPlanAccess(
  detail: PropertyDetail,
  planAccess: PublicPlanAccess,
): PropertyDetail {
  if (planAccess.allowsPremiumContent) return detail;

  return {
    ...detail,
    description: null,
    address: null,
    latitude: null,
    longitude: null,
    map_url: null,
    contact_phone: null,
    whatsapp_number: null,
    contact_email: null,
    website_url: null,
    instagram_url: null,
    facebook_url: null,
    check_in_time: null,
    check_out_time: null,
    highlights: [],
    owner_phone: null,
    owner_whatsapp: null,
  };
}

function sanitizeSearch(value: string | undefined) {
  return (value ?? "").replace(/[%_,()\\.*'"]/g, "").trim().slice(0, 80);
}

export type PublishedPropertyOptions = {
  requireApproved?: boolean;
};

export async function getPublishedProperties(
  filters: PropertyFilters = {},
  pageSize = 9,
  options: PublishedPropertyOptions = {},
): Promise<{ items: PropertyListItem[]; total: number }> {
  const supabase = await getServerClient();
  if (!supabase) return { items: [], total: 0 };

  try {
    const [lookups, publicationReady, changeRequestReady] = await Promise.all([
      getLookups(supabase),
      hasPropertyPublicationColumn(supabase),
      hasPropertyChangeRequestColumn(supabase),
    ]);
    const baseQuery = supabase.from("properties").select("*", { count: "exact" });
    let query = options.requireApproved
      ? baseQuery.eq("status", "approved")
      : applyPublicPropertyVisibility(baseQuery, changeRequestReady);
    if (publicationReady) query = query.eq("is_published", true);

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
      const conditions = [`name.ilike.*${search}*`, `district.ilike.*${search}*`];
      if (destinationIds.length) conditions.push(`destination_id.in.(${destinationIds.join(",")})`);
      query = query.or(conditions.join(","));
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

    if (filters.district) {
      const district = resolveDistrict(filters.district);
      if (!district) return { items: [], total: 0 };
      query = query.eq("district", district.name);
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

    const minRating = filters.minRating;
    if (typeof minRating === "number" && Number.isFinite(minRating) && minRating > 0) {
      const { data: ratingRows } = await supabase
        .from("reviews")
        .select("property_id,rating")
        .eq("status", "approved");
      const matchingIds = summarizeStats(
        (ratingRows ?? []) as { property_id: string; rating: number }[],
      )
        .filter((stat) => stat.average >= minRating)
        .map((stat) => stat.property_id);
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
    const [images, amenities, reviews, planAccess] = await Promise.all([
      getImagesForProperties(supabase, propertyIds),
      getAmenitiesForProperties(supabase, propertyIds),
      getReviewStats(supabase, propertyIds),
      getPublicPlanAccess(
        supabase,
        properties.map((property) => property.owner_id),
      ),
    ]);
    return {
      items: properties.map((property) => {
        const access = planAccess.get(property.owner_id) ?? {
          imageLimit: 1,
          allowsPremiumContent: false,
        };
        return toListItem(
          property,
          lookups,
          limitImagesForPlan(images.get(property.id) ?? [], access.imageLimit),
          amenities.get(property.id) ?? [],
          reviews.get(property.id) ?? { average: null, count: 0 },
          access,
        );
      }),
      total: count ?? properties.length,
    };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getApprovedPublishedProperties(
  filters: PropertyFilters = {},
  pageSize = 9,
): Promise<{ items: PropertyListItem[]; total: number }> {
  return getPublishedProperties(filters, pageSize, { requireApproved: true });
}

export async function getApprovedPublishedDestinationProperties(): Promise<
  Pick<PropertyRow, "destination_id" | "district">[]
> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  try {
    const publicationReady = await hasPropertyPublicationColumn(supabase);
    let query = supabase
      .from("properties")
      .select("destination_id,district")
      .eq("status", "approved");
    if (publicationReady) query = query.eq("is_published", true);

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as Pick<PropertyRow, "destination_id" | "district">[];
  } catch {
    return [];
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

export async function getTopRatedProperties(limit = 6, minimumReviews = 1): Promise<PropertyListItem[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("reviews")
      .select("property_id,rating")
      .eq("status", "approved");
    const stats = summarizeStats((data ?? []) as { property_id: string; rating: number }[]);
    const qualified = stats.filter((stat) => stat.count >= minimumReviews);

    if (!qualified.length) return [];

    const propertyIds = qualified.map((stat) => stat.property_id);
    const [publicationReady, changeRequestReady] = await Promise.all([
      hasPropertyPublicationColumn(supabase),
      hasPropertyChangeRequestColumn(supabase),
    ]);
    let propertyQuery = applyPublicPropertyVisibility(
      supabase.from("properties").select("*").in("id", propertyIds),
      changeRequestReady,
    );
    if (publicationReady) propertyQuery = propertyQuery.eq("is_published", true);
    const { data: propertyData } = await propertyQuery;
    const propertyMap = new Map(
      ((propertyData ?? []) as PropertyRow[]).map((property) => [property.id, property]),
    );
    const properties = propertyIds
      .map((id) => propertyMap.get(id))
      .filter((property): property is PropertyRow => Boolean(property));
    if (!properties.length) return [];

    const [lookups, images, amenities, planAccess] = await Promise.all([
      getLookups(supabase),
      getImagesForProperties(supabase, propertyIds),
      getAmenitiesForProperties(supabase, propertyIds),
      getPublicPlanAccess(
        supabase,
        properties.map((property) => property.owner_id),
      ),
    ]);
    const statMap = new Map(qualified.map((stat) => [stat.property_id, stat]));
    const premiumChecks = await Promise.all(
      properties.map(async (property) => {
        const { data: isPremium } = await supabase.rpc("property_has_active_premium", {
          p_property_id: property.id,
        });
        return { id: property.id, isPremium: isPremium === true };
      }),
    );
    const premiumIds = new Set(
      premiumChecks.filter((check) => check.isPremium).map((check) => check.id),
    );
    const priority = (property: PropertyRow) =>
      property.is_featured || property.plan_type === "premium" || premiumIds.has(property.id) ? 1 : 0;
    const sorted = properties
      .sort((a, b) => {
        const statA = statMap.get(a.id);
        const statB = statMap.get(b.id);
        return (
          (statB?.average ?? 0) - (statA?.average ?? 0) ||
          (statB?.count ?? 0) - (statA?.count ?? 0) ||
          priority(b) - priority(a)
        );
      })
      .slice(0, limit);

    return sorted.map((property) => {
      const access = planAccess.get(property.owner_id) ?? {
        imageLimit: 1,
        allowsPremiumContent: false,
      };
      return toListItem(
        property,
        lookups,
        limitImagesForPlan(images.get(property.id) ?? [], access.imageLimit),
        amenities.get(property.id) ?? [],
        statMap.get(property.id) ?? { average: null, count: 0 },
        access,
      );
    });
  } catch {
    return [];
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
    const [publicationReady, changeRequestReady] = await Promise.all([
      hasPropertyPublicationColumn(supabase),
      hasPropertyChangeRequestColumn(supabase),
    ]);
    let propertyQuery = applyPublicPropertyVisibility(
      supabase.from("properties").select("*").eq("slug", slug),
      changeRequestReady,
    );
    if (publicationReady) propertyQuery = propertyQuery.eq("is_published", true);
    const { data } = await propertyQuery.maybeSingle();
    const property = data as PropertyRow | null;
    if (!property) return null;

    const lookups = await getLookups(supabase);
    const [imageResult, amenityLinks, ownerResult, planAccess] = await Promise.all([
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
      getPublicPlanAccess(supabase, [property.owner_id]),
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

    const access = planAccess.get(property.owner_id) ?? {
      imageLimit: 1,
      allowsPremiumContent: false,
    };
    const images = limitImagesForPlan(
      (imageResult.data ?? []) as PropertyImageRow[],
      access.imageLimit,
    );
    const reviews = await getPropertyReviews(property.id, viewerId, guestToken);
    const summary = summarizeReviews(reviews);
    const base = toListItem(property, lookups, images, amenities, summary, access);
    return applyPublicPlanAccess(
      {
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
      },
      access,
    );
  } catch {
    return null;
  }
}

export async function getSimilarProperties(
  property: Pick<PropertyDetail, "id" | "city" | "district" | "category_slug">,
  limit = 3,
): Promise<PropertyListItem[]> {
  const { items } = await getPublishedProperties(
    {
      destination: property.city ? cityToSlug(property.city) : undefined,
      district: property.district ? cityToSlug(property.district) : undefined,
      page: 1,
    },
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

export async function getDistrictSummaries(): Promise<DistrictSummary[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const [publicationReady, changeRequestReady] = await Promise.all([
    hasPropertyPublicationColumn(supabase),
    hasPropertyChangeRequestColumn(supabase),
  ]);
  let propertiesQuery = applyPublicPropertyVisibility(
    supabase.from("properties").select("id,district"),
    changeRequestReady,
  );
  if (publicationReady) propertiesQuery = propertiesQuery.eq("is_published", true);
  const { data: properties } = await propertiesQuery;

  const grouped = new Map<string, { count: number; propertyIds: string[] }>();
  for (const property of (properties ?? []) as Pick<PropertyRow, "id" | "district">[]) {
    if (!isKeralaDistrict(property.district)) continue;
    const current = grouped.get(property.district) ?? { count: 0, propertyIds: [] };
    current.count += 1;
    current.propertyIds.push(property.id);
    grouped.set(property.district, current);
  }

  const imageMap = await getImagesForProperties(supabase, [
    ...new Set([...grouped.values()].flatMap((group) => group.propertyIds)),
  ]);

  return districtOptions
    .filter((option) => grouped.has(option.name))
    .map((option) => {
      const group = grouped.get(option.name)!;
      const images = group.propertyIds.flatMap((propertyId) => imageMap.get(propertyId) ?? []);
      const coverImage = (images.find((image) => image.is_cover) ?? images[0])?.public_url;
      return {
        name: option.name,
        slug: option.slug,
        state: keralaStateName,
        image: coverImage || getDistrictFallbackImage(option.name),
        propertyCount: group.count,
      };
    });
}
