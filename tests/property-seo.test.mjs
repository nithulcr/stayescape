import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://stayescape.example/";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function property(overrides = {}) {
  return {
    id: "property-1",
    name: "Hillside Stay",
    slug: "hillside-stay",
    status: "approved",
    is_published: true,
    has_requested_changes: false,
    short_description: null,
    description: "A verified hillside homestay with mountain views and a private balcony.",
    city: "Wayanad",
    district: "Wayanad",
    state: "Kerala",
    destination_slug: "wayanad",
    category_name: "Homestays",
    category_slug: "homestays",
    cover_image: "https://stayescape.example/hillside.jpg",
    images: [
      {
        id: "image-1",
        public_url: "https://stayescape.example/hillside.jpg",
        alt_text: null,
        is_cover: true,
      },
    ],
    highlights: ["Mountain views"],
    amenities: [{ name: "Breakfast" }],
    price_per_night: 4500,
    address: "Hillside Road",
    contact_phone: "+91 98765 43210",
    contact_email: null,
    website_url: null,
    latitude: 11.6854,
    longitude: 76.132,
    map_url: null,
    reviews: [],
    ...overrides,
  };
}

test("property metadata is unique, verified, and built from real property fields", async () => {
  const { getPropertyDescription, getPropertyTitle } = await import("../src/lib/seo/property.ts");

  const first = property();
  const second = property({
    id: "property-2",
    name: "Backwater Villa",
    slug: "backwater-villa",
    city: "Alappuzha",
    district: "Alappuzha",
    destination_slug: "alappuzha",
    category_name: "Villas",
    description: "A verified villa beside the backwaters with a private jetty.",
    cover_image: "https://stayescape.example/villa.jpg",
  });

  assert.equal(getPropertyTitle(first), "Hillside Stay in Wayanad | STAYESCAPE");
  assert.equal(getPropertyTitle(second), "Backwater Villa in Alappuzha | STAYESCAPE");
  assert.match(getPropertyDescription(first), /A verified hillside homestay/);
  assert.match(getPropertyDescription(first), /Located in Wayanad, Kerala/);
  assert.match(getPropertyDescription(second), /A verified villa beside the backwaters/);
  assert.notEqual(getPropertyTitle(first), getPropertyTitle(second));
  assert.notEqual(getPropertyDescription(first), getPropertyDescription(second));
});

test("property indexability excludes unpublished, pending, changed, and thin listings", async () => {
  const { PROPERTY_DESCRIPTION_MIN_LENGTH, isPropertyIndexable } = await import(
    "../src/lib/seo/property.ts"
  );

  assert.equal(PROPERTY_DESCRIPTION_MIN_LENGTH, 40);
  assert.equal(isPropertyIndexable(property()), true);
  assert.equal(isPropertyIndexable(property({ status: "pending" })), false);
  assert.equal(isPropertyIndexable(property({ status: "rejected" })), false);
  assert.equal(isPropertyIndexable(property({ is_published: false })), false);
  assert.equal(isPropertyIndexable(property({ has_requested_changes: true })), false);
  assert.equal(isPropertyIndexable(property({ city: null, district: null })), false);
  assert.equal(isPropertyIndexable(property({ description: null, short_description: null })), false);
  assert.equal(isPropertyIndexable(property({ description: "Short stay", short_description: null })), false);
  assert.equal(
    isPropertyIndexable(
      property({ description: null, short_description: null, category_name: null, price_per_night: null, address: null, contact_phone: null, highlights: [], amenities: [], images: [], cover_image: null }),
    ),
    false,
  );
});

test("property metadata emits a production canonical or explicit noindex", async () => {
  const { createPropertyMetadata } = await import("../src/lib/seo/property.ts");

  const indexable = createPropertyMetadata(property());
  assert.equal(indexable.alternates.canonical, "https://stayescape.example/properties/hillside-stay");
  assert.equal(indexable.openGraph.url, "https://stayescape.example/properties/hillside-stay");
  assert.deepEqual(indexable.robots, { index: true, follow: true });
  assert.deepEqual(indexable.openGraph.images, [
    { url: "https://stayescape.example/hillside.jpg" },
  ]);

  const noIndex = createPropertyMetadata(property({ status: "pending" }));
  assert.equal(noIndex.alternates, undefined);
  assert.deepEqual(noIndex.robots, { index: false, follow: false });
});

test("property structured data is factual lodging and breadcrumb data", async () => {
  const { buildPropertyJsonLd } = await import("../src/lib/seo/property.ts");

  const jsonLd = buildPropertyJsonLd({
    property: property(),
    canonicalUrl: "https://stayescape.example/properties/hillside-stay",
  });
  const serialized = JSON.stringify(jsonLd);
  const lodging = jsonLd["@graph"][1];

  assert.equal(jsonLd["@graph"][0]["@type"], "BreadcrumbList");
  assert.equal(jsonLd["@graph"][0].itemListElement[2].item, "https://stayescape.example/destinations/wayanad");
  assert.equal(lodging["@type"], "LodgingBusiness");
  assert.equal(lodging["@id"], "https://stayescape.example/properties/hillside-stay#property");
  assert.equal(lodging.url, "https://stayescape.example/properties/hillside-stay");
  assert.deepEqual(lodging.image, ["https://stayescape.example/hillside.jpg"]);
  assert.equal(lodging.address.addressLocality, "Wayanad");
  assert.equal(lodging.address.addressRegion, "Kerala");
  assert.equal(lodging.telephone, "+91 98765 43210");
  assert.equal(lodging.priceRange, "₹4,500");
  assert.equal(lodging.geo.latitude, 11.6854);
  assert.equal(lodging.amenityFeature[0].name, "Breakfast");
  assert.doesNotMatch(serialized, /aggregateRating|ratingValue|reviewCount/);
});

test("ratings only appear when genuine approved reviews exist", async () => {
  const { buildPropertyJsonLd } = await import("../src/lib/seo/property.ts");

  const jsonLd = buildPropertyJsonLd({
    property: property({
      reviews: [
        { status: "approved", rating: 5 },
        { status: "pending", rating: 1 },
      ],
    }),
    canonicalUrl: "https://stayescape.example/properties/hillside-stay",
  });

  assert.equal(jsonLd["@graph"][1].aggregateRating.ratingValue, 5);
  assert.equal(jsonLd["@graph"][1].aggregateRating.reviewCount, 1);
});

test("structured data omits fields that were not verified", async () => {
  const { buildPropertyJsonLd } = await import("../src/lib/seo/property.ts");

  const jsonLd = buildPropertyJsonLd({
    property: property({
      address: null,
      contact_phone: null,
      email: null,
      contact_email: null,
      website_url: null,
      latitude: null,
      longitude: null,
      map_url: null,
      amenities: [],
      images: [],
      cover_image: null,
      price_per_night: null,
    }),
    canonicalUrl: "https://stayescape.example/properties/hillside-stay",
  });
  const serialized = JSON.stringify(jsonLd);

  assert.doesNotMatch(serialized, /streetAddress|telephone|priceRange|GeoCoordinates|hasMap|sameAs|amenityFeature/);
});

test("gallery alt text is meaningful and different for each image", async () => {
  const { getPropertyImageAlt } = await import("../src/lib/seo/property.ts");

  const first = getPropertyImageAlt(
    { public_url: "https://stayescape.example/hillside.jpg", alt_text: null },
    property(),
    0,
  );
  const second = getPropertyImageAlt(
    { public_url: "https://stayescape.example/balcony.jpg", alt_text: null },
    property(),
    1,
  );

  assert.equal(first, "View 1 of Hillside Stay in Wayanad, Kerala");
  assert.equal(second, "View 2 of Hillside Stay in Wayanad, Kerala");
  assert.equal(
    getPropertyImageAlt(
      { public_url: "https://stayescape.example/balcony.jpg", alt_text: "Sunset from the private balcony" },
      property(),
      0,
    ),
    "Sunset from the private balcony",
  );
});

test("property page and sitemap use the shared SEO rules and verified links", () => {
  const page = read("../src/app/(public)/properties/[slug]/page.tsx");
  const gallery = read("../src/components/properties/property-gallery.tsx");
  const publicData = read("../src/lib/data/public.ts");
  const sitemapData = read("../src/lib/data/sitemap.ts");

  assert.match(page, /createPropertyMetadata\(property\)/);
  assert.match(page, /buildPropertyJsonLd/);
  assert.match(page, /getPropertyBreadcrumbLinks/);
  assert.match(page, /aria-label="Breadcrumb"/);
  assert.match(page, /href=\{`\/categories\/\$\{property\.category_slug\}`\}/);
  assert.match(page, /href=\{`\/destinations\/\$\{property\.destination_slug\}`\}/);
  assert.match(page, /<PropertyGallery property=\{property\} \/>/);
  assert.doesNotMatch(page, /cover_image \?\? fallbackPropertyImage/);

  assert.match(gallery, /getPropertyImageAlt/);
  assert.match(publicData, /destination_slug: destination\?\.slug \?\? null/);
  assert.match(sitemapData, /isPropertyIndexable/);
  assert.match(sitemapData, /has_requested_changes/);
});
