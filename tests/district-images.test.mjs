import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("district fallback thumbnails are unique", async () => {
  const { districtFallbackImages, getDistrictFallbackImage } = await import(
    "../src/lib/media.ts"
  );

  const values = Object.values(districtFallbackImages);
  assert.equal(values.length, 14);
  assert.equal(new Set(values).size, values.length);

  const reportedDistricts = ["Kannur", "Kozhikode", "Palakkad", "Thrissur"];
  const reportedImages = reportedDistricts.map((district) => getDistrictFallbackImage(district));
  assert.equal(new Set(reportedImages).size, reportedDistricts.length);
});

test("district summaries use real property covers before unique fallbacks", () => {
  const publicData = read("../src/lib/data/public.ts");

  assert.match(publicData, /getDistrictFallbackImage\(option\.name\)/);
  assert.match(publicData, /getImagesForProperties/);
  assert.match(publicData, /images\.find\(\(image\) => image\.is_cover\)/);
  assert.doesNotMatch(publicData, /destination\?\.image_url \|\| fallbackPropertyImage/);
});
