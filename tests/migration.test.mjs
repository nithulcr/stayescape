import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/0012_pricing_and_owner_limits.sql");
const initial = read("../supabase/migrations/0001_initial_schema.sql");
const entitlement = read("../supabase/migrations/0004_super_admin_entitlement.sql");
const seed = read("../supabase/seed.sql");
const premiumImageLimit = read("../supabase/migrations/0016_premium_image_limit.sql");
const storageImagePolicy = read("../supabase/migrations/0017_storage_image_limit_policy.sql");
const subscriptionUserName = read("../supabase/migrations/0021_subscription_user_name.sql");

test("migration updates the existing plan catalog", () => {
  assert.match(migration, /alter type public\.billing_cycle add value if not exists 'six_month'/);
  assert.match(migration, /add column if not exists price_six_month numeric\(10,2\) not null default 0/);
  assert.match(migration, /where code = 'free'/);
  assert.match(migration, /where code = 'premium'/);
  assert.match(migration, /price_monthly = 499/);
  assert.match(migration, /price_six_month = 2499/);
  assert.match(migration, /price_yearly = 4999/);
  assert.match(seed, /499, 2499, 4999, 3, 5/);
});

test("migration preserves subscriptions, payments and the owner-based model", () => {
  assert.doesNotMatch(migration, /create table public\.plans/i);
  assert.doesNotMatch(migration, /alter table public\.(subscriptions|payments)/i);
  assert.doesNotMatch(migration, /(delete from|truncate|drop table|drop column)/i);
  assert.doesNotMatch(migration, /property_id/i);
});

test("database remains the final authority for property limits and concurrency", () => {
  assert.match(initial, /perform 1 from public\.profiles p where p\.id = new\.owner_id for update/);
  assert.match(initial, /new\.owner_id is distinct from auth\.uid\(\)/);
  assert.match(initial, /if public\.is_admin\(\) or public\.is_service_role\(\) then/);
  assert.match(initial, /raise exception 'Plan property limit reached'/);
  assert.match(entitlement, /1000000/);
  assert.match(entitlement, /pl\.max_properties/);
  assert.match(entitlement, /p\.role = 'super_admin'/);
});

test("migration file ordering leaves earlier migrations intact", () => {
  assert.match(initial, /create type public\.billing_cycle as enum \('monthly', 'yearly'\)/);
  assert.match(initial, /price_monthly numeric\(10,2\) not null default 0/);
  assert.match(initial, /price_yearly numeric\(10,2\) not null default 0/);
});

test("premium plan allows five photos per property", () => {
  assert.match(premiumImageLimit, /max_images_per_property = 5/);
  assert.match(premiumImageLimit, /where code = 'premium'/);
  assert.match(premiumImageLimit, /'5 photos per property'/);
  assert.match(read("../src/lib/plans/plan-defaults.ts"), /maxImagesPerProperty: 5/);
});

test("storage image policy uses the property owner for the plan limit", () => {
  assert.match(storageImagePolicy, /drop policy if exists "Owners can upload property images"/);
  assert.match(storageImagePolicy, /plan_limit_for\(\s*\(\s*select p\.owner_id/);
  assert.doesNotMatch(
    storageImagePolicy,
    /plan_limit_for\(\(\(storage\.foldername\(name\)\)\[2\]\)::uuid/,
  );
  assert.match(storageImagePolicy, /bucket_id = 'property-images'/);
});

test("subscription rows show the owner user name", () => {
  assert.match(subscriptionUserName, /add column if not exists user_name text/);
  assert.match(subscriptionUserName, /alter column user_name set not null/);
  assert.match(subscriptionUserName, /public\.subscription_user_name_for_owner\(new\.owner_id\)/);
  assert.match(subscriptionUserName, /before insert or update on public\.subscriptions/);
  assert.match(subscriptionUserName, /after update of full_name, email on public\.profiles/);
  assert.match(subscriptionUserName, /app\.subscription_user_name_sync/);
  assert.match(read("../src/types/database.types.ts"), /user_name: string;/);
});
