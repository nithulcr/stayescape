import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://stayescape.example/";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const publicPages = [
  "../src/app/(public)/page.tsx",
  "../src/app/(public)/properties/page.tsx",
  "../src/app/(public)/properties/[slug]/page.tsx",
  "../src/app/(public)/destinations/page.tsx",
  "../src/app/(public)/destinations/[slug]/page.tsx",
  "../src/app/(public)/categories/[slug]/page.tsx",
  "../src/app/(public)/contact/page.tsx",
  "../src/app/(public)/pricing/page.tsx",
  "../src/app/(public)/list-your-property/page.tsx",
  "../src/app/(public)/account-deletion/page.tsx",
  "../src/app/(public)/account-suspended/page.tsx",
  "../src/app/(public)/acceptable-use-policy/page.tsx",
  "../src/app/(public)/cancellation-refund-policy/page.tsx",
  "../src/app/(public)/cookie-policy/page.tsx",
  "../src/app/(public)/disclaimer/page.tsx",
  "../src/app/(public)/grievance-redressal/page.tsx",
  "../src/app/(public)/listing-policy/page.tsx",
  "../src/app/(public)/owner-terms/page.tsx",
  "../src/app/(public)/privacy-policy/page.tsx",
  "../src/app/(public)/review-policy/page.tsx",
  "../src/app/(public)/security/page.tsx",
  "../src/app/(public)/subscription-policy/page.tsx",
  "../src/app/(public)/terms-and-conditions/page.tsx",
  "../src/app/(public)/user-terms/page.tsx",
];

test("canonical origins reject localhost and preview hosts", async () => {
  const { normalizeSeoOrigin } = await import("../src/lib/config.ts");

  assert.equal(normalizeSeoOrigin("https://stayescape.example/"), "https://stayescape.example");
  assert.equal(normalizeSeoOrigin("http://stayescape.example/path"), "http://stayescape.example");
  assert.equal(normalizeSeoOrigin("http://localhost:3000"), null);
  assert.equal(normalizeSeoOrigin("https://127.0.0.1"), null);
  assert.equal(normalizeSeoOrigin("https://app-git-main.vercel.app"), null);
  assert.equal(normalizeSeoOrigin("https://app.vercel.dev"), null);
  assert.equal(normalizeSeoOrigin("not-a-url"), null);
  assert.equal(normalizeSeoOrigin(null), null);
});

test("page metadata emits production canonicals and explicit robots directives", async () => {
  const { createPageMetadata, createNoIndexMetadata, getCanonicalUrl } = await import(
    "../src/lib/seo/metadata.ts"
  );

  const metadata = createPageMetadata({
    title: "Explore stays",
    description: "Browse stays",
    path: "/properties",
    image: "https://stayescape.example/cover.jpg",
  });

  assert.equal(metadata.alternates.canonical, "https://stayescape.example/properties");
  assert.equal(metadata.openGraph.url, "https://stayescape.example/properties");
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.openGraph.images, [{ url: "https://stayescape.example/cover.jpg" }]);

  const noIndex = createNoIndexMetadata("Private page");
  assert.equal(noIndex.alternates, undefined);
  assert.deepEqual(noIndex.robots, { index: false, follow: false });
  assert.equal(getCanonicalUrl("destinations/wayanad/"), "https://stayescape.example/destinations/wayanad");
});

test("root layout does not set a global canonical and public pages use the metadata helper", () => {
  const rootLayout = read("../src/app/layout.tsx");
  assert.doesNotMatch(rootLayout, /alternates:\s*\{\s*canonical:/);

  for (const path of publicPages) {
    const source = read(path);
    assert.match(source, /createPageMetadata|createNoIndexMetadata/, path);
    assert.doesNotMatch(source, /canonical:\s*["']/, path);
  }
});

test("robots blocks private routes and advertises only the production sitemap", async () => {
  const robotsModule = await import("../src/app/robots.ts");
  const robots = robotsModule.default();

  assert.equal(robots.rules.userAgent, "*");
  assert.equal(robots.rules.allow, "/");
  for (const path of [
    "/admin/",
    "/api/",
    "/auth/",
    "/dashboard/",
    "/forgot-password",
    "/login",
    "/register",
    "/reset-password",
  ]) {
    assert.ok(robots.rules.disallow.includes(path), path);
  }
  assert.equal(robots.sitemap, "https://stayescape.example/sitemap.xml");
  assert.doesNotMatch(JSON.stringify(robots), /localhost|vercel\.app/i);
});

test("sitemap builder excludes private or filtered URLs and uses record timestamps", async () => {
  const { buildPublicSitemap, CATEGORY_INDEX_THRESHOLD } = await import("../src/lib/seo/sitemap.ts");
  assert.equal(CATEGORY_INDEX_THRESHOLD, 2);

  const entries = buildPublicSitemap(
    [
      { path: "/" },
      {
        path: "/properties",
        updatedAt: "2026-01-02T03:04:05.000Z",
        changeFrequency: "daily",
        priority: 0.9,
      },
      { path: "/properties" },
      { path: "/properties?category=resorts" },
      { path: "/admin/manual-requests" },
      { path: "/dashboard/bookings" },
      { path: "/auth/login" },
      { path: "/account-suspended" },
      { path: "/categories/resorts", updatedAt: "2026-02-01T00:00:00.000Z" },
    ],
    "https://stayescape.example",
  );

  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      "https://stayescape.example",
      "https://stayescape.example/properties",
      "https://stayescape.example/categories/resorts",
    ],
  );
  assert.equal(entries[0].lastModified, undefined);
  assert.equal(entries[1].lastModified.toISOString(), "2026-01-02T03:04:05.000Z");
  assert.equal(entries[1].changeFrequency, "daily");
  assert.deepEqual(buildPublicSitemap([{ path: "/" }], null), []);
});

test("sitemap data uses public RLS, published filters, and category quality thresholds", () => {
  const data = read("../src/lib/data/sitemap.ts");
  assert.match(data, /createClient<Database>\(url, anonKey/);
  assert.doesNotMatch(data, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(data, /hasPropertyPublicationColumn/);
  assert.match(data, /eq\("status", "approved"\)/);
  assert.match(data, /eq\("is_published", true\)/);
  assert.match(data, /isDestinationIndexable/);
  assert.match(data, /isPropertyIndexable/);
  assert.match(data, /has_requested_changes/);
  assert.match(data, /public_allows_premium_content/);
  assert.doesNotMatch(data, /applyPublicPropertyVisibility/);
  assert.match(data, /eq\("is_active", true\)/);
  assert.match(data, /CATEGORY_INDEX_THRESHOLD/);
  assert.match(data, /updated_at/);
  assert.match(data, /if \(propertyResult\.error\) return STATIC_PAGES/);
});

test("private pages and missing public records are not indexed", () => {
  const authLayout = read("../src/app/(auth)/layout.tsx");
  assert.match(authLayout, /robots:\s*\{\s*index: false, follow: false\s*\}/);

  for (const path of [
    "../src/app/auth/verify/page.tsx",
    "../src/app/auth/reset-password/page.tsx",
    "../src/app/admin/layout.tsx",
    "../src/app/dashboard/layout.tsx",
    "../src/app/(public)/account-suspended/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /index: false|createNoIndexMetadata/, path);
  }

  const propertyPage = read("../src/app/(public)/properties/[slug]/page.tsx");
  const destinationPage = read("../src/app/(public)/destinations/[slug]/page.tsx");
  const categoryPage = read("../src/app/(public)/categories/[slug]/page.tsx");
  assert.match(propertyPage, /createNoIndexMetadata\("Property not found"\)/);
  assert.match(destinationPage, /createNoIndexMetadata\("Destination not found"\)/);
  assert.match(categoryPage, /createNoIndexMetadata\("Stay type not found"\)/);
  assert.match(categoryPage, /indexable: total >= CATEGORY_INDEX_THRESHOLD/);
});

test("structured data stays factual and category cards use real category pages", () => {
  const propertyPage = read("../src/app/(public)/properties/[slug]/page.tsx");
  const propertySeo = read("../src/lib/seo/property.ts");
  assert.match(propertyPage, /buildPropertyJsonLd/);
  assert.match(propertyPage, /createPropertyMetadata/);
  assert.match(propertySeo, /"@type": "LodgingBusiness"/);
  assert.match(propertySeo, /"@type": "BreadcrumbList"/);
  assert.match(propertySeo, /getApprovedReviewStats/);

  const categoryGrid = read("../src/components/home/category-grid.tsx");
  assert.match(categoryGrid, /href=\{`\/categories\/\$\{category\.slug\}`\}/);
});
