"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { districtOptions } from "@/lib/config";
import type { AmenityRow, CategoryRow, DestinationRow } from "@/types/database.types";
import type { PropertyFilters } from "@/types";

export function PropertyFiltersBar({
  filters,
  destinations,
  categories,
  amenities,
}: {
  filters: PropertyFilters;
  destinations: DestinationRow[];
  categories: CategoryRow[];
  amenities: AmenityRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const fields = [
      "q",
      "destination",
      "district",
      "category",
      "minPrice",
      "maxPrice",
      "minRating",
      "sort",
    ] as const;
    for (const field of fields) {
      const value = String(form.get(field) ?? "").trim();
      if (value) params.set(field, value);
    }
    for (const value of form.getAll("amenity")) {
      if (typeof value === "string" && value) params.append("amenity", value);
    }
    router.push(`/properties${params.size ? `?${params.toString()}` : ""}`);
  };

  const activeCount = [
    filters.q,
    filters.destination,
    filters.district,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.amenity?.length,
  ].filter(Boolean).length;

  return (
    <form onSubmit={submit} className="surface-card mb-8 p-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_0.7fr_0.7fr]">
        <label>
          <span className="field-label">Search</span>
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Property name" className="input-field" />
        </label>
        <label>
          <span className="field-label">Destination</span>
          <select name="destination" defaultValue={filters.destination ?? ""} className="input-field">
            <option value="">All destinations</option>
            {destinations.map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">District</span>
          <select name="district" defaultValue={filters.district ?? ""} className="input-field">
            <option value="">All districts</option>
            {districtOptions.map((district) => (
              <option key={district.slug} value={district.slug}>{district.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Stay type</span>
          <select name="category" defaultValue={filters.category ?? ""} className="input-field">
            <option value="">All types</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Min price</span>
          <input
            name="minPrice"
            type="number"
            min={0}
            defaultValue={filters.minPrice ?? ""}
            placeholder="₹0"
            className="input-field"
          />
        </label>
        <label>
          <span className="field-label">Max price</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={filters.maxPrice ?? ""}
            placeholder="Any"
            className="input-field"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forest/10 pt-4">
        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-secondary !py-2">
          <SlidersHorizontal size={14} /> More filters
          {activeCount > 0 && <span className="rounded-full bg-forest px-1.5 text-[0.65rem] text-white">{activeCount}</span>}
        </button>
        <div className="flex items-center gap-3">
          <select name="sort" defaultValue={filters.sort ?? "newest"} className="input-field !w-auto !py-2">
            <option value="newest">Newest first</option>
            <option value="featured">Featured first</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
          </select>
          <button type="submit" className="btn-primary !py-2">Apply</button>
          {activeCount > 0 && (
            <button type="button" onClick={() => router.push("/properties")} className="inline-flex items-center gap-1 text-xs text-muted hover:text-forest">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-5 border-t border-forest/10 pt-4">
          <label className="max-w-xs">
            <span className="field-label">Minimum rating</span>
            <select name="minRating" defaultValue={filters.minRating ? String(filters.minRating) : ""} className="input-field">
              <option value="">Any rating</option>
              <option value="3">3 stars and above</option>
              <option value="4">4 stars and above</option>
              <option value="4.5">4.5 stars and above</option>
            </select>
          </label>
          {amenities.length > 0 && (
            <div>
              <span className="field-label">Amenities</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {amenities.map((amenity) => (
                  <label key={amenity.id} className="flex items-center gap-2 text-xs text-charcoal/80">
                    <input
                      type="checkbox"
                      name="amenity"
                      value={amenity.id}
                      defaultChecked={filters.amenity?.includes(amenity.id)}
                      className="h-4 w-4 accent-[#123D32]"
                    />
                    {amenity.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
