import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const migration = read("../supabase/migrations/0024_review_moderation_workflow.sql");
const publicData = read("../src/lib/data/public.ts");
const databaseTypes = read("../src/types/database.types.ts");
const reviewActions = read("../src/app/actions/reviews.ts");
const reviewList = read("../src/components/properties/review-list.tsx");
const reviewForm = read("../src/components/properties/review-form.tsx");
const propertyCard = read("../src/components/properties/property-card.tsx");
const ownerData = read("../src/lib/data/owner.ts");
const ownerActions = read("../src/app/dashboard/reviews/actions.ts");
const ownerPage = read("../src/app/dashboard/reviews/page.tsx");
const ownerNav = read("../src/components/dashboard/dashboard-nav.tsx");
const adminActions = read("../src/app/admin/actions.ts");

test("free properties auto-approve reviews while premium stays pending", () => {
  assert.match(migration, /create or replace function public\.set_initial_review_status/);
  assert.match(migration, /before insert on public\.reviews/);
  assert.match(migration, /public\.property_has_active_premium\(new\.property_id\)/);
  assert.match(migration, /new\.status := 'pending'/);
  assert.match(migration, /new\.status := 'approved'/);
  assert.match(migration, /status in \('pending', 'approved'\)/);
});

test("only property owners and super admins can moderate reviews", () => {
  assert.match(migration, /Property owners can moderate reviews/);
  assert.match(migration, /Property owners can remove reviews/);
  assert.match(migration, /p\.owner_id = auth\.uid\(\)/);
  assert.match(migration, /Property owners can only approve or remove reviews/);
  assert.doesNotMatch(migration, /drop policy if exists "Admins manage reviews"/);
  assert.match(ownerActions, /property\.owner_id !== user\.id/);
  assert.match(ownerActions, /update\(\{ status \}\)/);
  assert.match(ownerPage, /moderateOwnerReviewAction/);
  assert.match(ownerNav, /\/dashboard\/reviews/);
  assert.match(adminActions, /export async function moderateReviewAction/);
  assert.match(adminActions, /export async function deleteReviewAdminAction/);
});

test("public review reads show owner-approved and guest-owned pending reviews", () => {
  assert.match(reviewList, /review\.status === "approved" \|\| isOwnReview\(review\)/);
  assert.match(reviewList, /guestToken/);
  assert.match(reviewActions, /status: "pending"/);
  assert.match(reviewForm, /published immediately on free listings/);
  assert.match(ownerData, /export async function getOwnerReviews/);
});

test("top rated stays show reviewed properties first and never reuse featured", () => {
  assert.match(publicData, /getTopRatedProperties\(limit = 6, minimumReviews = 1\)/);
  assert.match(publicData, /property_has_active_premium/);
  assert.match(databaseTypes, /property_has_active_premium:/);
  assert.match(publicData, /\(statB\?\.average \?\? 0\) - \(statA\?\.average \?\? 0\)/);
  assert.match(publicData, /\(statB\?\.count \?\? 0\) - \(statA\?\.count \?\? 0\)/);
  assert.match(publicData, /priority\(b\) - priority\(a\)/);
  assert.doesNotMatch(publicData, /return getFeaturedProperties\(limit\)/);
});

test("property cards show five rating stars and hide review totals", () => {
  assert.match(propertyCard, /Array\.from\(\{ length: 5 \}/);
  assert.match(propertyCard, /index < rating \? "currentColor" : "none"/);
  assert.match(propertyCard, /out of 5 stars/);
  assert.doesNotMatch(propertyCard, /review_count\} review/);
});
