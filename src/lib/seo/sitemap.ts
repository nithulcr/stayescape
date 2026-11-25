import type { MetadataRoute } from "next";
import { getSeoOrigin } from "../config.ts";

export const CATEGORY_INDEX_THRESHOLD = 2;

export type SitemapRecord = {
  path: string;
  updatedAt?: string | Date | null;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

const PRIVATE_PATH_SEGMENTS = [
  "/admin",
  "/dashboard",
  "/auth",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api",
  "/account-suspended",
  "/manual-requests",
  "/_next",
];

export function normalizeSitemapPath(path: string): string | null {
  if (!path.startsWith("/") || path.includes("?") || path.includes("#")) return null;
  const normalized = path.replace(/\/+$/, "") || "/";
  if (PRIVATE_PATH_SEGMENTS.some((segment) => normalized === segment || normalized.startsWith(`${segment}/`))) {
    return null;
  }
  return normalized;
}

function toLastModified(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function buildPublicSitemap(
  records: SitemapRecord[],
  origin: string | null = getSeoOrigin(),
): MetadataRoute.Sitemap {
  if (!origin) return [];

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  for (const record of records) {
    const path = normalizeSitemapPath(record.path);
    if (!path || seen.has(path)) continue;
    seen.add(path);

    entries.push({
      url: path === "/" ? origin : `${origin}${path}`,
      lastModified: toLastModified(record.updatedAt),
      changeFrequency: record.changeFrequency,
      priority: record.priority,
    });
  }

  return entries;
}
