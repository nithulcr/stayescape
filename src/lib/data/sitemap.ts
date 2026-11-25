import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDestinationIndexable } from "@/lib/seo/destination";
import { CATEGORY_INDEX_THRESHOLD } from "@/lib/seo/sitemap";
import type { SitemapRecord } from "@/lib/seo/sitemap";
import { hasPropertyPublicationColumn } from "@/lib/supabase/schema";
import type { CategoryRow, Database, DestinationRow, PropertyRow } from "@/types/database.types";

type Client = SupabaseClient<Database>;

const STATIC_PAGES: SitemapRecord[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/properties", changeFrequency: "daily", priority: 0.9 },
  { path: "/destinations", changeFrequency: "weekly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.6 },
  { path: "/list-your-property", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/account-deletion", changeFrequency: "yearly", priority: 0.3 },
  { path: "/acceptable-use-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cancellation-refund-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/disclaimer", changeFrequency: "yearly", priority: 0.3 },
  { path: "/grievance-redressal", changeFrequency: "yearly", priority: 0.3 },
  { path: "/listing-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/owner-terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/review-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/security", changeFrequency: "yearly", priority: 0.3 },
  { path: "/subscription-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/user-terms", changeFrequency: "yearly", priority: 0.3 },
];

function getPublicClient(): Client | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function latestTimestamp(values: (string | null | undefined)[]): string | null {
  return values.reduce<string | null>((latest, value) => {
    if (!value) return latest;
    if (!latest || value > latest) return value;
    return latest;
  }, null);
}

export async function getSitemapRecords(): Promise<SitemapRecord[]> {
  const supabase = getPublicClient();
  if (!supabase) return STATIC_PAGES;

  try {
    const publicationReady = await hasPropertyPublicationColumn(supabase);

    let propertyQuery = supabase
      .from("properties")
      .select("slug,updated_at,destination_id,category_id")
      .eq("status", "approved");
    if (publicationReady) propertyQuery = propertyQuery.eq("is_published", true);

    const [propertyResult, destinationResult, categoryResult] = await Promise.all([
      propertyQuery,
      supabase.from("destinations").select("*").eq("is_active", true),
      supabase.from("categories").select("*").eq("is_active", true),
    ]);

    if (propertyResult.error) return STATIC_PAGES;

    const properties = (propertyResult.data ?? []) as Pick<
      PropertyRow,
      "slug" | "updated_at" | "destination_id" | "category_id"
    >[];
    const destinations = (destinationResult.data ?? []) as DestinationRow[];
    const categories = (categoryResult.data ?? []) as CategoryRow[];

    const destinationCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const destinationUpdates = new Map<string, string[]>();
    const categoryUpdates = new Map<string, string[]>();

    for (const property of properties) {
      if (!property.slug) continue;

      if (property.destination_id) {
        destinationCounts.set(
          property.destination_id,
          (destinationCounts.get(property.destination_id) ?? 0) + 1,
        );
        destinationUpdates.set(property.destination_id, [
          ...(destinationUpdates.get(property.destination_id) ?? []),
          property.updated_at,
        ]);
      }

      if (property.category_id) {
        categoryCounts.set(property.category_id, (categoryCounts.get(property.category_id) ?? 0) + 1);
        categoryUpdates.set(property.category_id, [
          ...(categoryUpdates.get(property.category_id) ?? []),
          property.updated_at,
        ]);
      }
    }

    const categoryRecords: SitemapRecord[] = categories
      .filter((category) => (categoryCounts.get(category.id) ?? 0) >= CATEGORY_INDEX_THRESHOLD)
      .map((category) => ({
        path: `/categories/${category.slug}`,
        updatedAt: latestTimestamp([
          category.updated_at,
          ...(categoryUpdates.get(category.id) ?? []),
        ]),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    const destinationRecords: SitemapRecord[] = destinations
      .filter((destination) =>
        isDestinationIndexable(destination, destinationCounts.get(destination.id) ?? 0),
      )
      .map((destination) => ({
        path: `/destinations/${destination.slug}`,
        updatedAt: latestTimestamp([
          destination.updated_at,
          ...(destinationUpdates.get(destination.id) ?? []),
        ]),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const propertyRecords: SitemapRecord[] = properties.map((property) => ({
      path: `/properties/${property.slug}`,
      updatedAt: property.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...STATIC_PAGES, ...categoryRecords, ...destinationRecords, ...propertyRecords];
  } catch {
    return STATIC_PAGES;
  }
}
