import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const migration = read("../supabase/migrations/0022_property_change_requests.sql");
const adminPage = read("../src/app/admin/properties/page.tsx");
const adminData = read("../src/lib/data/admin.ts");
const databaseTypes = read("../src/types/database.types.ts");
const globals = read("../src/app/globals.css");

test("property change requests are stored and cleared by approval", () => {
  assert.match(migration, /has_requested_changes boolean not null default false/);
  assert.match(migration, /change_requested_at timestamptz/);
  assert.match(migration, /properties_requested_changes_idx/);
  assert.match(migration, /new\.has_requested_changes := true/);
  assert.match(migration, /new\.status = 'approved'/);
  assert.match(migration, /new\.has_requested_changes := false/);
  assert.match(adminData, /changeRequestsOnly\?: boolean/);
  assert.match(adminData, /query\.eq\("has_requested_changes", true\)/);
  assert.match(databaseTypes, /has_requested_changes: boolean/);
  assert.match(databaseTypes, /change_requested_at: string \| null/);
});

test("admin properties page separates requested changes from active properties", () => {
  assert.match(adminPage, /view === "requests" \? "requests" : "active"/);
  assert.match(adminPage, /changeRequestsOnly: activeView === "requests"/);
  assert.match(adminPage, /href=\{viewHref\("active"\)\}/);
  assert.match(adminPage, /href=\{viewHref\("requests"\)\}/);
  assert.match(adminPage, /name="view" value=\{activeView\}/);
  assert.match(adminPage, /No requested changes/);
});

test("public card grids become swipeable sliders on mobile", () => {
  assert.match(globals, /\.mobile-card-slider \{[\s\S]*scroll-snap-type: x mandatory/);
  assert.match(globals, /\.mobile-card-slider > \* \{[\s\S]*scroll-snap-align: start/);
  assert.match(globals, /@media \(min-width: 640px\) \{[\s\S]*\.mobile-card-slider/);

  const homeGridFiles = [
    "../src/components/home/property-section.tsx",
    "../src/components/home/destination-grid.tsx",
    "../src/components/home/district-grid.tsx",
    "../src/components/home/category-grid.tsx",
    "../src/components/home/testimonials.tsx",
  ];

  for (const path of homeGridFiles) {
    assert.match(read(path), /mobile-card-slider/);
  }

  assert.match(read("../src/app/(public)/page.tsx"), /<DestinationGrid[^>]*slider/);

  const unchangedPages = [
    "../src/app/(public)/properties/page.tsx",
    "../src/app/(public)/properties/[slug]/page.tsx",
    "../src/app/(public)/destinations/[slug]/page.tsx",
    "../src/app/(public)/destinations/page.tsx",
    "../src/app/(public)/list-your-property/page.tsx",
  ];

  for (const path of unchangedPages) {
    assert.doesNotMatch(read(path), /mobile-card-slider/);
  }
});

test("app icon assets exist", () => {
  assert.ok(existsSync(new URL("../src/app/icon.png", import.meta.url)));
  assert.ok(existsSync(new URL("../src/app/apple-icon.png", import.meta.url)));
});
