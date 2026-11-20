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

export const imageConstraints = {
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
} as const;
