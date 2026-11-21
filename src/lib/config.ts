export const brand = {
  name: "STAYSCAPE",
  tagline: "Discover. Stay. Experience.",
  description:
    "Discover beautiful resorts, villas, homestays and unique stays across Kerala and beyond.",
  email: "hello@stayscape.example",
} as const;

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const storageBucket =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET || "property-images";

export const keralaStateName = "Kerala";

export const keralaDistricts = [
  "Kasaragod",
  "Kannur",
  "Wayanad",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Thrissur",
  "Ernakulam",
  "Idukki",
  "Kottayam",
  "Alappuzha",
  "Pathanamthitta",
  "Kollam",
  "Thiruvananthapuram",
] as const;

export type KeralaDistrict = (typeof keralaDistricts)[number];

export type DistrictOption = {
  name: KeralaDistrict;
  slug: string;
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const districtOptions: DistrictOption[] = keralaDistricts.map((name) => ({
  name,
  slug: toSlug(name),
}));

export function isKeralaDistrict(value: unknown): value is KeralaDistrict {
  return typeof value === "string" && keralaDistricts.includes(value as KeralaDistrict);
}

export function resolveDistrict(value: string | undefined | null): DistrictOption | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return (
    districtOptions.find(
      (option) => option.slug === normalized || option.name.toLowerCase() === normalized,
    ) ?? null
  );
}

export const imageConstraints = {
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
} as const;
