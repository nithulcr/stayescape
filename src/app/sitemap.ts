import type { MetadataRoute } from "next";
import { getSitemapRecords } from "@/lib/data/sitemap";
import { buildPublicSitemap } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const records = await getSitemapRecords();
  return buildPublicSitemap(records);
}
