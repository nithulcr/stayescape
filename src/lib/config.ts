export const brand = {
  name: "STAYESCAPE",
  tagline: "Discover. Stay. Experience.",
  description:
    "Discover beautiful resorts, villas, homestays and unique stays across Kerala and beyond.",
  email: "hello@STAYESCAPE.example",
} as const;

export function normalizeSeoOrigin(value: string | undefined | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;

    const hostname = parsed.hostname.toLowerCase();
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("localhost.") ||
      hostname.endsWith(".localhost");
    const isPreview =
      hostname === "vercel.app" ||
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".vercel.dev") ||
      hostname.endsWith(".preview.local");

    if (isLocalhost || isPreview) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export const seoOrigin = normalizeSeoOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export const siteUrl = seoOrigin ?? "http://localhost:3000";

export function getSeoOrigin(): string | null {
  return seoOrigin;
}

export const storageBucket =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET || "property-images";

export const manualPaymentProofBucket =
  process.env.NEXT_PUBLIC_MANUAL_PAYMENT_PROOF_BUCKET || "manual-payment-proofs";

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
