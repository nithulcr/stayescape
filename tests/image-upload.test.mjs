import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canUploadAnotherImage,
  effectiveImageLimit,
  imageLimitMessage,
} from "../src/lib/uploads/image-limit.ts";
import { describeStorageError, uploadFailureFrom } from "../src/lib/uploads/upload-errors.ts";
import { validateImageUpload } from "../src/lib/uploads/validate-image.ts";
import { imageConstraints } from "../src/lib/config.ts";
import { effectivePlanLimits } from "../src/lib/plans/effective-limits.ts";
import {
  FALLBACK_FREE_LIMITS,
  FALLBACK_PREMIUM_LIMITS,
} from "../src/lib/plans/plan-defaults.ts";

function pngBytes(width = 2, height = 2) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[16] = (width >> 8) & 0xff;
  bytes[17] = width & 0xff;
  bytes[20] = (height >> 8) & 0xff;
  bytes[21] = height & 0xff;
  return bytes;
}

function fakeFile(bytes, name, type, size = bytes.length) {
  return {
    size,
    type,
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function entitlement(overrides = {}) {
  return {
    plan_code: "premium",
    plan_name: "Premium",
    has_premium: true,
    is_unlimited: false,
    max_properties: 3,
    max_images_per_property: 5,
    price_monthly: 499,
    price_six_month: 2499,
    price_yearly: 4999,
    features: ["5 photos per property"],
    expired_listing_visibility: "keep_visible",
    ...overrides,
  };
}

test("premium owners can upload images two through five", () => {
  assert.equal(canUploadAnotherImage(0, 5), true);
  assert.equal(canUploadAnotherImage(1, 5), true);
  assert.equal(canUploadAnotherImage(4, 5), true);
  assert.equal(canUploadAnotherImage(5, 5), false);
  assert.equal(imageLimitMessage("Premium", 5), "Your Premium plan allows 5 images per property.");
});

test("free owners and super admins get their correct limits", () => {
  assert.equal(canUploadAnotherImage(0, 1), true);
  assert.equal(canUploadAnotherImage(1, 1), false);
  assert.equal(canUploadAnotherImage(999, 1_000_000), true);
  assert.equal(imageLimitMessage("Free", 1), "Your Free plan allows 1 image per property.");
});

test("expired premium and database limits fall back to free image limits", () => {
  assert.equal(effectiveImageLimit(5, 5), 5);
  assert.equal(effectiveImageLimit(5, 1), 1);
  assert.equal(effectiveImageLimit(5, null), 5);

  const fallbacks = { free: FALLBACK_FREE_LIMITS, premium: FALLBACK_PREMIUM_LIMITS };
  const active = effectivePlanLimits(entitlement(), fallbacks);
  assert.equal(active.maxImagesPerProperty, 5);

  const expired = effectivePlanLimits(
    entitlement({ has_premium: false, status: "expired" }),
    fallbacks,
  );
  assert.equal(expired.maxImagesPerProperty, 1);
  assert.equal(expired.planName, "Free");

  const superAdmin = effectivePlanLimits(
    entitlement({ is_unlimited: true, max_images_per_property: 1_000_000 }),
    fallbacks,
  );
  assert.equal(superAdmin.maxImagesPerProperty, 1_000_000);
});

test("upload routes calculate limits server-side from the property owner", () => {
  const ownerRoute = source("../src/app/api/owner/images/route.ts");
  const adminRoute = source("../src/app/api/admin/property-images/route.ts");

  assert.match(ownerRoute, /getPlanContextForUser\(context\.user\.id\)/);
  assert.match(ownerRoute, /canUploadAnotherImage/);
  assert.match(ownerRoute, /effectiveImageLimit/);
  assert.match(ownerRoute, /plan_limit_for/);
  assert.match(ownerRoute, /\.eq\("owner_id", context\.user\.id\)/);
  assert.doesNotMatch(ownerRoute, /formData\.get\(["']maxImages/);

  assert.match(adminRoute, /getPlanContextForUser\(property\.owner_id\)/);
  assert.match(adminRoute, /canUploadAnotherImage/);
  assert.match(adminRoute, /effectiveImageLimit/);
  assert.match(adminRoute, /plan_limit_for/);
  assert.doesNotMatch(adminRoute, /formData\.get\(["']maxImages/);
});

test("upload routes log real storage errors and return safe messages", () => {
  for (const path of [
    "../src/app/api/owner/images/route.ts",
    "../src/app/api/admin/property-images/route.ts",
  ]) {
    const route = source(path);
    assert.match(route, /logUploadError/);
    assert.match(route, /logUploadDiagnostics/);
    assert.match(route, /is_active_property_owner/);
    assert.match(route, /storage_property_path_is_owned/);
    assert.match(route, /describeStorageError/);
    assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
  }
});

test("storage errors are mapped to useful safe messages", () => {
  assert.equal(
    describeStorageError({ message: "new row violates row-level security policy", statusCode: "403" }),
    "You do not have permission to upload images for this property.",
  );
  assert.equal(
    describeStorageError({ message: "Bucket not found", statusCode: "404" }),
    "Image storage is not configured. Please contact support.",
  );
  assert.equal(
    describeStorageError({ message: "payload too large", statusCode: "413" }),
    "Images must be 5 MB or smaller.",
  );
  assert.equal(
    describeStorageError({ message: "network error" }),
    "Upload network error. Check your connection and try again.",
  );
  assert.equal(describeStorageError({ message: "unknown failure" }), "Upload failed. Please try again.");
  assert.deepEqual(uploadFailureFrom(new Error("fetch failed")), {
    message: "fetch failed",
    statusCode: null,
  });
});

test("valid image formats and size limits are enforced", async () => {
  assert.deepEqual([...imageConstraints.acceptedTypes], [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

  const result = await validateImageUpload(fakeFile(pngBytes(), "Holiday  Photo!.png", "image/png"));
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.image.extension, "png");
    assert.equal(result.image.contentType, "image/png");
    assert.equal(result.image.fileName, "Holiday_Photo_.png");
  }

  const oversized = fakeFile(pngBytes(), "large.png", "image/png", imageConstraints.maxBytes + 1);
  const oversizedResult = await validateImageUpload(oversized);
  assert.equal(oversizedResult.ok, false);
  if (!oversizedResult.ok) assert.equal(oversizedResult.error, "Images must be 5 MB or smaller.");

  const mismatch = await validateImageUpload(fakeFile(pngBytes(), "wrong.jpg", "image/jpeg"));
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) assert.equal(mismatch.error, "The image type does not match its contents.");

  const invalid = await validateImageUpload(fakeFile(new Uint8Array([1, 2, 3]), "bad.png", "image/png"));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.error, "Use a valid JPG, PNG, WebP or AVIF image.");
});

test("migrations fix premium image limit and storage ownership lookup", () => {
  const planMigration = source("../supabase/migrations/0016_premium_image_limit.sql");
  assert.match(planMigration, /max_images_per_property = 1[\s\S]*code = 'free'|code = 'free'[\s\S]*max_images_per_property = 1/);
  assert.match(planMigration, /code = 'premium'[\s\S]*max_images_per_property = 5|max_images_per_property = 5[\s\S]*code = 'premium'/);

  const policyMigration = source("../supabase/migrations/0017_storage_image_limit_policy.sql");
  assert.match(policyMigration, /"Owners can upload property images"/);
  assert.match(policyMigration, /plan_limit_for\(\(\s*select p\.owner_id/);
  assert.doesNotMatch(policyMigration, /plan_limit_for\(\(select id from public\.properties/i);

  const entitlementMigration = source("../supabase/migrations/0018_effective_image_entitlement.sql");
  assert.match(entitlementMigration, /create or replace function public\.get_owner_entitlement/);
  assert.match(entitlementMigration, /v_has_premium then[\s\S]*v_image_limit := coalesce\(v_plan\.max_images_per_property/);
  assert.match(entitlementMigration, /else[\s\S]*v_image_limit := coalesce\(v_free_image_limit, 1\)/);

  const lifecycleMigration = source("../supabase/migrations/0014_subscription_lifecycle.sql");
  assert.match(lifecycleMigration, /create or replace function public\.is_service_role/);
  assert.match(lifecycleMigration, /current_user in \('service_role', 'postgres', 'supabase_admin'\)/);

  const maintenanceMigration = source(
    "../supabase/migrations/0019_maintenance_service_role_context.sql",
  );
  assert.match(maintenanceMigration, /create or replace function public\.is_service_role/);
  assert.match(maintenanceMigration, /current_user in \('service_role', 'postgres', 'supabase_admin'\)/);

  const forcePolicy = source("../supabase/migrations/0020_force_storage_upload_policy.sql");
  assert.match(forcePolicy, /drop policy if exists "Owners can upload property images"/);
  assert.match(forcePolicy, /plan_limit_for\(\(\s*select p\.owner_id/);
});
