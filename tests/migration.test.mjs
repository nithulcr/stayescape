import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/0012_pricing_and_owner_limits.sql");
const initial = read("../supabase/migrations/0001_initial_schema.sql");
const entitlement = read("../supabase/migrations/0004_super_admin_entitlement.sql");
const seed = read("../supabase/seed.sql");

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
