import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategories, getPublishedProperties } from "@/lib/data/public";
import { CATEGORY_INDEX_THRESHOLD } from "@/lib/seo/sitemap";
import {
  createNoIndexMetadata,
  createPageMetadata,
} from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return createNoIndexMetadata("Stay type not found");

  const { total } = await getPublishedProperties({ category: slug }, 1);
  const description =
    category.description ??
    `Browse approved ${category.name.toLowerCase()} stays across Kerala on STAYESCAPE.`;

  return createPageMetadata({
    title: `${category.name} stays in Kerala`,
    description,
    path: `/categories/${category.slug}`,
    indexable: total >= CATEGORY_INDEX_THRESHOLD,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [categories, result] = await Promise.all([
    getCategories(),
    getPublishedProperties({ category: slug }, 15),
  ]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const description =
    category.description ??
    `Browse approved ${category.name.toLowerCase()} stays across Kerala on STAYESCAPE.`;

  return (
    <div className="site-container py-12 md:py-16">
      <Link href="/properties" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-forest">
        <ArrowLeft size={13} /> All stays
      </Link>

      <div className="mt-6 mb-8 max-w-3xl">
        <p className="eyebrow">Stay type</p>
        <h1 className="display-title mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">{category.name} stays</h1>
        <p className="mt-4 text-sm text-muted md:text-base">{description}</p>
      </div>

      {result.items.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No stays in this category yet"
          description="Browse all approved Kerala stays while new listings are added."
          actionLabel="View all stays"
          actionHref="/properties"
        />
      )}
    </div>
  );
}
