import { brand } from "../config.ts";
import { fallbackPropertyImage } from "../media.ts";
import { formatINR } from "../utils/index.ts";
import { createNoIndexMetadata, createPageMetadata } from "./metadata.ts";

export const PROPERTY_DESCRIPTION_MIN_LENGTH = 40;

export type PropertySeoImage = {
  public_url?: string | null;
  alt_text?: string | null;
  is_cover?: boolean | null;
};

export type PropertySeoInput = {
  name: string;
  slug: string;
  status?: string | null;
  is_published?: boolean | null;
  has_requested_changes?: boolean | null;
  short_description?: string | null;
  description?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  destination_slug?: string | null;
  cover_image?: string | null;
  images?: PropertySeoImage[];
  highlights?: string[];
  amenities?: { name: string }[];
  price_per_night?: number | null;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  map_url?: string | null;
  reviews?: { status: string; rating: number }[];
};

export type PropertyBreadcrumbLink = {
  name: string;
  path: string;
};

function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function truncate(value: string, maximum = 160): string {
  if (value.length <= maximum) return value;
  const prefix = value.slice(0, maximum);
  const lastSpace = prefix.lastIndexOf(" ");
  return `${(lastSpace > 100 ? prefix.slice(0, lastSpace) : prefix).trimEnd()}…`;
}

export function getPropertyLocation(property: PropertySeoInput): string {
  const seen = new Set<string>();
  return [trimmed(property.city), trimmed(property.district), trimmed(property.state)]
    .filter((part) => {
      const key = part.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

export function getPropertyVerifiedDescription(property: PropertySeoInput): string {
  return trimmed(property.description) || trimmed(property.short_description);
}

export function hasVerifiedPropertyDescription(property: PropertySeoInput): boolean {
  return getPropertyVerifiedDescription(property).length >= PROPERTY_DESCRIPTION_MIN_LENGTH;
}

export function getPropertyTitle(property: PropertySeoInput): string {
  const location = trimmed(property.city) || trimmed(property.district);
  return location ? `${property.name} in ${location} | ${brand.name}` : `${property.name} | ${brand.name}`;
}

export function getPropertyDescription(property: PropertySeoInput): string {
  const verified = getPropertyVerifiedDescription(property);
  const location = getPropertyLocation(property);
  const category = trimmed(property.category_name);

  if (verified) {
    const locationSentence =
      location && !verified.toLowerCase().includes(location.toLowerCase())
        ? ` Located in ${location}.`
        : "";
    return truncate(`${verified}${locationSentence}`);
  }

  if (location) {
    const stayType = category ? ` (${category})` : "";
    return truncate(
      `View ${property.name}${stayType} in ${location}. Read property details and contact information on ${brand.name}.`,
    );
  }

  return truncate(`Read property details and contact information for ${property.name} on ${brand.name}.`);
}

export function getPropertySeoImage(property: PropertySeoInput): string | null {
  const cover = property.images?.find((image) => image.is_cover) ?? property.images?.[0];
  const actualCover = trimmed(cover?.public_url);
  const declaredCover = trimmed(property.cover_image);
  const usableDeclaredCover =
    declaredCover && declaredCover !== fallbackPropertyImage ? declaredCover : "";
  return actualCover || usableDeclaredCover || null;
}

export function getPropertyImageAlt(
  image: PropertySeoImage,
  property: PropertySeoInput,
  index: number,
): string {
  const provided = trimmed(image.alt_text);
  const generic =
    /^(image|photo|picture|cover|hero|property|stay)(\s*(image|photo|picture|cover|hero|property|stay)?\s*\d+)?$/i;
  if (provided.length >= 8 && !generic.test(provided)) return provided;

  const location = getPropertyLocation(property);
  const category = trimmed(property.category_name);
  const context = location ? ` in ${location}` : category ? ` ${category.toLowerCase()}` : "";
  return `View ${index + 1} of ${property.name}${context}`;
}

export function isPropertyIndexable(property: PropertySeoInput): boolean {
  const verifiedDescription = getPropertyVerifiedDescription(property);
  const hasLocation = Boolean(trimmed(property.city) || trimmed(property.district));
  const detailSignals = [
    Boolean(trimmed(property.category_name)),
    Boolean(property.price_per_night),
    Boolean(trimmed(property.address)),
    Boolean(trimmed(property.contact_phone) || trimmed(property.contact_email) || trimmed(property.website_url)),
    Boolean(property.highlights?.length),
    Boolean(property.amenities?.length),
  ].filter(Boolean).length;

  return (
    Boolean(trimmed(property.name) && trimmed(property.slug)) &&
    property.status === "approved" &&
    property.is_published !== false &&
    property.has_requested_changes !== true &&
    Boolean(trimmed(property.destination_slug)) &&
    hasLocation &&
    verifiedDescription.length >= PROPERTY_DESCRIPTION_MIN_LENGTH &&
    detailSignals >= 1
  );
}

export function createPropertyMetadata(property: PropertySeoInput) {
  const title = getPropertyTitle(property);
  const description = getPropertyDescription(property);

  if (!isPropertyIndexable(property)) {
    return createNoIndexMetadata(title, description);
  }

  return createPageMetadata({
    title,
    description,
    path: `/properties/${property.slug}`,
    image: getPropertySeoImage(property),
  });
}

export function getPropertyBreadcrumbLinks(property: PropertySeoInput): PropertyBreadcrumbLink[] {
  const links: PropertyBreadcrumbLink[] = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
  ];

  if (trimmed(property.destination_slug) && trimmed(property.city)) {
    links.push({
      name: trimmed(property.city),
      path: `/destinations/${trimmed(property.destination_slug)}`,
    });
  }

  links.push({ name: property.name, path: `/properties/${property.slug}` });
  return links;
}

function getApprovedReviewStats(property: PropertySeoInput) {
  const reviews = (property.reviews ?? []).filter(
    (review) => review.status === "approved" && Number.isFinite(review.rating),
  );
  if (!reviews.length) return null;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export function buildPropertyJsonLd({
  property,
  canonicalUrl,
}: {
  property: PropertySeoInput;
  canonicalUrl: string;
}) {
  const origin = new URL(canonicalUrl).origin;
  const breadcrumbs = getPropertyBreadcrumbLinks(property).map((link, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: link.name,
    item: link.path === "/" ? origin : `${origin}${link.path}`,
  }));
  const locality = trimmed(property.city) || trimmed(property.district);
  const region = trimmed(property.state);
  const streetAddress = trimmed(property.address);
  const hasAddress = Boolean(locality || region || streetAddress);
  const image = getPropertySeoImage(property);
  const reviewStats = getApprovedReviewStats(property);
  const latitude =
    property.latitude === null || property.latitude === undefined
      ? Number.NaN
      : Number(property.latitude);
  const longitude =
    property.longitude === null || property.longitude === undefined
      ? Number.NaN
      : Number(property.longitude);
  const hasGeo = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs,
      },
      {
        "@type": "LodgingBusiness",
        "@id": `${canonicalUrl}#property`,
        name: property.name,
        url: canonicalUrl,
        description: getPropertyVerifiedDescription(property) || undefined,
        image: image ? [image] : undefined,
        address: hasAddress
          ? {
              "@type": "PostalAddress",
              streetAddress: streetAddress || undefined,
              addressLocality: locality || undefined,
              addressRegion: region || undefined,
              addressCountry: locality || region ? "IN" : undefined,
            }
          : undefined,
        telephone: trimmed(property.contact_phone) || undefined,
        priceRange: property.price_per_night ? formatINR(property.price_per_night) : undefined,
        geo: hasGeo
          ? {
              "@type": "GeoCoordinates",
              latitude,
              longitude,
            }
          : undefined,
        hasMap: trimmed(property.map_url) || undefined,
        sameAs: trimmed(property.website_url) || undefined,
        amenityFeature: property.amenities?.length
          ? property.amenities.map((amenity) => ({
              "@type": "LocationFeatureSpecification",
              name: amenity.name,
            }))
          : undefined,
        aggregateRating: reviewStats
          ? {
              "@type": "AggregateRating",
              ratingValue: reviewStats.average,
              reviewCount: reviewStats.count,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      },
    ],
  };
}
