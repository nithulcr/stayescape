import type { Metadata } from "next";
import { brand, getSeoOrigin } from "../config.ts";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  indexable?: boolean;
};

export function normalizeMetadataPath(path: string): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  if (withLeadingSlash === "/") return "/";
  return withLeadingSlash.replace(/\/+$/, "");
}

export function getCanonicalUrl(path: string): string | null {
  const origin = getSeoOrigin();
  if (!origin) return null;
  return `${origin}${normalizeMetadataPath(path)}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  indexable = true,
}: PageMetadataInput): Metadata {
  const canonical = indexable ? getCanonicalUrl(path) : null;
  const ogImage = image && image.trim() ? [{ url: image }] : undefined;
  const twitterImage = image && image.trim() ? [image] : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      siteName: brand.name,
      title,
      description,
      url: canonical ?? undefined,
      locale: "en_IN",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImage,
    },
    robots: { index: indexable, follow: indexable },
  };
}

export function createNoIndexMetadata(title: string, description?: string): Metadata {
  return createPageMetadata({
    title,
    description: description ?? `${title} on ${brand.name}.`,
    path: "/",
    indexable: false,
  });
}
