import type { Metadata } from "next";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyFiltersBar } from "@/components/properties/property-filters";
import { Pagination } from "@/components/properties/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getAllAmenities,
  getCategories,
  getDestinations,
  getPublishedProperties,
} from "@/lib/data/public";
import type { PropertyFilters } from "@/types";

export const metadata: Metadata = {
  title: "Explore stays",
  description: "Browse approved resorts, villas, homestays and unique stays across Kerala.",
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawAmenities = params.amenity;
  const amenity = rawAmenities
    ? (Array.isArray(rawAmenities) ? rawAmenities : [rawAmenities]).filter(Boolean)
    : [];

  const filters: PropertyFilters = {
    q: value(params, "q"),
    destination: value(params, "destination"),
    category: value(params, "category"),
    minPrice: Number(value(params, "minPrice")) || undefined,
    maxPrice: Number(value(params, "maxPrice")) || undefined,
    amenity,
    sort: value(params, "sort") as PropertyFilters["sort"],
    page: Number(value(params, "page")) || 1,
  };

  const pageSize = 9;
  const [destinations, categories, amenities, result] = await Promise.all([
    getDestinations(),
    getCategories(),
    getAllAmenities(),
    getPublishedProperties(filters, pageSize),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const currentPage = Math.min(filters.page ?? 1, totalPages);

  return (
    <div className="site-container py-12 md:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="eyebrow">Explore</p>
        <h1 className="display-title mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">Find a stay you love.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          Every property here has been reviewed by our team. Filter by destination, stay type, amenities and price.
        </p>
      </div>

      <PropertyFiltersBar filters={filters} destinations={destinations} categories={categories} amenities={amenities} />

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">
          <strong className="text-forest-deep">{result.total}</strong> {result.total === 1 ? "stay" : "stays"} found
        </p>
      </div>

      {result.items.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No stays match those filters"
          description="Try removing a filter or browsing all destinations. New properties are added regularly."
          actionLabel="Clear filters"
          actionHref="/properties"
        />
      )}

      <Pagination page={currentPage} totalPages={totalPages} params={params} />
    </div>
  );
}
