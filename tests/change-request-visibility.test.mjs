import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const migration = read("../supabase/migrations/0023_keep_change_request_properties_visible.sql");
const publicData = read("../src/lib/data/public.ts");
const schema = read("../src/lib/supabase/schema.ts");
const utils = read("../src/lib/utils/index.ts");
const ownerDashboard = read("../src/app/dashboard/properties/page.tsx");
const types = read("../src/types/index.ts");

test("change-request edits stay visible while approval is pending", () => {
  assert.match(migration, /create or replace function public\.property_is_visible/);
  assert.match(migration, /pr\.status = 'approved'/);
  assert.match(migration, /pr\.status = 'pending' and coalesce\(pr\.has_requested_changes, false\)/);
  assert.match(migration, /new\.is_published := old\.is_published/);
  assert.match(migration, /new\.publish_after_renewal := old\.publish_after_renewal/);
  assert.match(migration, /Anyone can enquire about published properties/);
  assert.match(
    migration,
    /p\.status = 'pending'\s+and coalesce\(p\.has_requested_changes, false\)\s+and p\.is_published/,
  );
});

test("public queries include visible change-request properties", () => {
  assert.match(publicData, /hasPropertyChangeRequestColumn/);
  assert.match(
    publicData,
    /status\.eq\.approved,and\(status\.eq\.pending,has_requested_changes\.eq\.true\)/,
  );
  assert.match(publicData, /applyPublicPropertyVisibility\(/);
  assert.match(schema, /hasPropertyChangeRequestColumn/);
  assert.match(types, /has_requested_changes: boolean/);
  assert.match(publicData, /has_requested_changes: property\.has_requested_changes \?\? false/);
});

test("owner dashboard keeps the public view link visible while editing", () => {
  assert.match(utils, /export function isPropertyPubliclyVisible/);
  assert.match(utils, /property\.status === "pending" && Boolean\(property\.has_requested_changes\)/);
  assert.match(ownerDashboard, /isPropertyPubliclyVisible\(property\)/);
  assert.doesNotMatch(ownerDashboard, /property\.status === "approved" && \(\s*<Link href={`\/properties/);
});
