import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://stayescape.example/";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function destination(overrides = {}) {
  return {
    id: "destination-1",
    name: "Wayanad",
    slug: "wayanad",
    state: "Kerala",
    short_description: "Verified short introduction.",
    description: "Verified full introduction for this destination.",
    image_url: "https://stayescape.example/wayanad.jpg",
    seo_title: null,
    seo_description: null,
    is_active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function property(overrides = {}) {
  return {
    id: "property-1",
    name: "Hillside Stay",
    slug: "hillside-stay",
    category_slug: "homestays",
    amenities: [{ id: "pool", name: "Pool" }],
    ...overrides,
  };
}

test("destination metadata is unique and uses verified content only", async () => {
  const { getDestinationDescription, getDestinationTitle } = await import(
    "../src/lib/seo/destination.ts"
  );

  const first = destination();
  const second = destination({
    id: "destination-2",
    name: "Kannur",
    slug: "kannur",
    short_description: "Verified Kannur introduction.",
    description: "Verified full introduction for Kannur.",
    seo_title: "Stays in Kannur with verified local content",
    seo_description: "Verified Kannur SEO description.",
  });

  assert.equal(getDestinationTitle(first), "Stays in Wayanad");
  assert.equal(getDestinationTitle(second), "Stays in Kannur with verified local content");
  assert.equal(getDestinationDescription(first), "Verified full introduction for this destination.");
  assert.equal(getDestinationDescription(second), "Verified Kannur SEO description.");
  assert.notEqual(getDestinationTitle(first), getDestinationTitle(second));
  assert.notEqual(getDestinationDescription(first), getDestinationDescription(second));

  const missingIntro = destination({
    name: "Kozhikode",
    slug: "kozhikode",
    short_description: null,
    description: null,
  });
  assert.match(getDestinationDescription(missingIntro), /approved and published stays in Kozhikode/);
});

test("destination indexability matches sitemap quality rules", async () => {
  const {
    DESTINATION_INDEX_THRESHOLD,
    hasVerifiedDestinationIntro,
    isDestinationIndexable,
  } = await import("../src/lib/seo/destination.ts");

  assert.equal(DESTINATION_INDEX_THRESHOLD, 1);
  assert.equal(hasVerifiedDestinationIntro(destination()), true);
  assert.equal(hasVerifiedDestinationIntro(destination({ description: null, short_description: null })), false);
  assert.equal(isDestinationIndexable(destination(), 1), true);
  assert.equal(isDestinationIndexable(destination(), 0), false);
  assert.equal(isDestinationIndexable(destination({ is_active: false }), 1), false);
  assert.equal(
    isDestinationIndexable(destination({ description: null, short_description: null }), 3),
    false,
  );
});

test("destination categories and amenities are derived from visible property data", async () => {
  const { deriveDestinationAmenities, deriveDestinationCategories } = await import(
    "../src/lib/seo/destination.ts"
  );

  const properties = [
    property(),
    property({
      id: "property-2",
      category_slug: "villas",
      amenities: [{ id: "pool", name: "Pool" }, { id: "view", name: "View" }],
    }),
  ];
  const categories = [
    { id: "1", name: "Homestays", slug: "homestays", description: "Verified copy" },
    { id: "2", name: "Villas", slug: "villas", description: null },
    { id: "3", name: "Resorts", slug: "resorts", description: null },
  ];

  assert.deepEqual(
    deriveDestinationCategories(properties, categories).map((item) => [item.slug, item.count]),
    [["homestays", 1], ["villas", 1]],
  );
  assert.deepEqual(
    deriveDestinationAmenities(properties).map((item) => [item.id, item.count]),
    [["pool", 2], ["view", 1]],
  );
});

test("related destinations come from shared property districts without hardcoding locations", async () => {
  const { deriveRelatedDestinations } = await import("../src/lib/seo/destination.ts");

  const current = destination();
  const destinations = [
    current,
    destination({ id: "destination-2", name: "Kannur", slug: "kannur", sort_order: 2 }),
    destination({
      id: "destination-3",
      name: "Kozhikode",
      slug: "kozhikode",
      sort_order: 3,
    }),
    destination({
      id: "destination-4",
      name: "Kasaragod",
      slug: "kasaragod",
      sort_order: 4,
    }),
  ];
  const properties = [
    { destination_id: "destination-1", district: "Wayanad" },
    { destination_id: "destination-2", district: "Wayanad" },
    { destination_id: "destination-3", district: "Kozhikode" },
  ];

  const related = deriveRelatedDestinations(current, destinations, properties);
  assert.equal(related.basedOnSharedDistrict, true);
  assert.deepEqual(related.items.map((item) => item.slug), ["kannur"]);
});

test("destination JSON-LD is factual breadcrumb and collection data", async () => {
  const { buildDestinationJsonLd } = await import("../src/lib/seo/destination.ts");

  const jsonLd = buildDestinationJsonLd({
    destination: destination(),
    canonicalUrl: "https://stayescape.example/destinations/wayanad",
    properties: [property()],
  });
  const serialized = JSON.stringify(jsonLd);

  assert.equal(jsonLd["@graph"][0]["@type"], "BreadcrumbList");
  assert.equal(jsonLd["@graph"][1]["@type"], "CollectionPage");
  assert.equal(jsonLd["@graph"][1].mainEntity["@type"], "ItemList");
  assert.equal(jsonLd["@graph"][1].mainEntity.numberOfItems, 1);
  assert.match(serialized, /https:\/\/stayescape\.example\/properties\/hillside-stay/);
  assert.doesNotMatch(serialized, /aggregateRating|ratingValue|reviewCount|FAQPage/);
});

test("destination page uses approved published properties and real destination fields", () => {
  const page = read("../src/app/(public)/destinations/[slug]/page.tsx");
  const publicData = read("../src/lib/data/public.ts");
  const sitemapData = read("../src/lib/data/sitemap.ts");
  const seoHelper = read("../src/lib/seo/destination.ts");

  assert.match(page, /getApprovedPublishedProperties/);
  assert.match(page, /getApprovedPublishedDestinationProperties/);
  assert.doesNotMatch(page, /getPublishedProperties\(/);
  assert.match(page, /if \(!destination\) notFound\(\)/);
  assert.match(page, /indexable: isDestinationIndexable/);
  assert.match(page, /aria-label="Breadcrumb"/);
  assert.match(page, /buildDestinationJsonLd/);
  assert.match(page, /deriveDestinationCategories/);
  assert.match(page, /deriveDestinationAmenities/);
  assert.match(page, /deriveRelatedDestinations/);
  assert.match(page, /md:grid-cols-2 lg:grid-cols-3/);
  assert.doesNotMatch(page, /FAQ|best time to visit|how to reach|nearby destinations/i);

  assert.match(publicData, /export async function getApprovedPublishedProperties/);
  assert.match(publicData, /requireApproved: true/);
  assert.match(publicData, /baseQuery\.eq\("status", "approved"\)/);
  assert.match(publicData, /export async function getApprovedPublishedDestinationProperties/);
  assert.match(publicData, /eq\("is_published", true\)/);

  assert.match(sitemapData, /isDestinationIndexable/);
  assert.match(sitemapData, /eq\("status", "approved"\)/);
  assert.doesNotMatch(sitemapData, /has_requested_changes/);

  assert.match(seoHelper, /DESTINATION_INDEX_THRESHOLD = 1/);
  assert.match(seoHelper, /hasVerifiedDestinationIntro/);
});

test("canonical URLs remain production-safe for destination routes", async () => {
  const { getCanonicalUrl } = await import("../src/lib/seo/metadata.ts");
  assert.equal(
    getCanonicalUrl("/destinations/kannur"),
    "https://stayescape.example/destinations/kannur",
  );
});
