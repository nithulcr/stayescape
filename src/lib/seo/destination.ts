import type { CategoryRow, DestinationRow } from "../../types/database.types.ts";
import type { PropertyListItem } from "../../types/index.ts";

export const DESTINATION_INDEX_THRESHOLD = 1;

export type DestinationCategoryLink = {
  name: string;
  slug: string;
  count: number;
  description: string | null;
};

export type DestinationAmenityLink = {
  id: string;
  name: string;
  count: number;
};

export type RelatedDestinationLink = {
  items: DestinationRow[];
  basedOnSharedDistrict: boolean;
};

export type DestinationJsonLdInput = {
  destination: DestinationRow;
  canonicalUrl: string;
  properties: Pick<PropertyListItem, "name" | "slug">[];
};

export function getDestinationTitle(destination: DestinationRow): string {
  return destination.seo_title?.trim() || `Stays in ${destination.name}`;
}

export function getDestinationDescription(destination: DestinationRow): string {
  const verified =
    destination.seo_description?.trim() ||
    destination.description?.trim() ||
    destination.short_description?.trim();
  if (verified) return verified;

  const location = destination.state?.trim()
    ? `${destination.name}, ${destination.state}`
    : destination.name;
  return `Browse approved and published stays in ${location} on STAYESCAPE.`;
}

export function hasVerifiedDestinationIntro(destination: DestinationRow): boolean {
  return Boolean(
    destination.description?.trim() || destination.short_description?.trim(),
  );
}

export function isDestinationIndexable(
  destination: DestinationRow,
  publishedPropertyCount: number,
): boolean {
  return (
    destination.is_active &&
    publishedPropertyCount >= DESTINATION_INDEX_THRESHOLD &&
    hasVerifiedDestinationIntro(destination)
  );
}

export function deriveDestinationCategories(
  properties: PropertyListItem[],
  categories: Pick<CategoryRow, "id" | "name" | "slug" | "description">[],
): DestinationCategoryLink[] {
  const counts = new Map<string, number>();
  for (const property of properties) {
    if (!property.category_slug) continue;
    counts.set(property.category_slug, (counts.get(property.category_slug) ?? 0) + 1);
  }

  return categories
    .filter((category) => counts.has(category.slug))
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      count: counts.get(category.slug) ?? 0,
      description: category.description,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function deriveDestinationAmenities(
  properties: PropertyListItem[],
  limit = 8,
): DestinationAmenityLink[] {
  const counts = new Map<string, DestinationAmenityLink>();
  for (const property of properties) {
    for (const amenity of property.amenities) {
      const existing = counts.get(amenity.id);
      if (existing) existing.count += 1;
      else counts.set(amenity.id, { id: amenity.id, name: amenity.name, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit);
}

export function deriveRelatedDestinations(
  current: DestinationRow,
  destinations: DestinationRow[],
  properties: Pick<PropertyRowForRelations, "destination_id" | "district">[],
  limit = 4,
): RelatedDestinationLink {
  const currentDistricts = new Set(
    properties
      .filter((property) => property.destination_id === current.id && property.district)
      .map((property) => property.district as string),
  );
  const destinationIdsWithProperties = new Set(
    properties
      .filter((property) => property.destination_id)
      .map((property) => property.destination_id as string),
  );

  const ranked = destinations
    .filter(
      (destination) =>
        destination.id !== current.id && destinationIdsWithProperties.has(destination.id),
    )
    .map((destination) => ({
      destination,
      sharedDistrictCount: properties.filter(
        (property) =>
          property.destination_id === destination.id &&
          property.district &&
          currentDistricts.has(property.district),
      ).length,
    }))
    .sort(
      (left, right) =>
        right.sharedDistrictCount - left.sharedDistrictCount ||
        left.destination.sort_order - right.destination.sort_order ||
        left.destination.name.localeCompare(right.destination.name),
    )
    .slice(0, limit);

  const sharedDistrictMatches = ranked.filter((item) => item.sharedDistrictCount > 0);
  const matches = sharedDistrictMatches.length ? sharedDistrictMatches : ranked;

  return {
    items: matches.map((item) => item.destination),
    basedOnSharedDistrict: sharedDistrictMatches.length > 0,
  };
}

type PropertyRowForRelations = {
  destination_id: string | null;
  district: string | null;
};

export function buildDestinationJsonLd({
  destination,
  canonicalUrl,
  properties,
}: DestinationJsonLdInput) {
  const origin = new URL(canonicalUrl).origin;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          {
            "@type": "ListItem",
            position: 2,
            name: "Destinations",
            item: `${origin}/destinations`,
          },
          { "@type": "ListItem", position: 3, name: destination.name, item: canonicalUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: destination.name,
        description: getDestinationDescription(destination),
        image: destination.image_url ?? undefined,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: properties.length,
          itemListElement: properties.map((property, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: property.name,
            url: `${origin}/properties/${property.slug}`,
          })),
        },
      },
    ],
  };
}
