import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import type { PropertyListItem } from "@/types";

export function PropertySection({
  items,
  eyebrow,
  title,
  description,
  href = "/properties",
  emptyMessage = "No published properties yet. Approved stays will appear here.",
}: {
  items: PropertyListItem[];
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  emptyMessage?: string;
}) {
  return (
    <section className="section-space ">
      <div className="site-container">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="section-title mt-3">{title}</h2>
            <p className="mt-3 text-sm text-muted md:text-base">{description}</p>
          </div>
          <Link href={href} className="btn-secondary shrink-0 hidden md:inline-flex">
            View all stays <ArrowRight size={15} />
          </Link>
        </div>

        {items.length ? (
          <div className="mx-[-1.25rem] md:mx-0">
            <div className="mobile-card-slider gap-4 md:gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 px-[1.25rem] md:px-0">
            {items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          </div>
        ) : (
          <div className="surface-card px-6 py-14 text-center text-sm text-muted">{emptyMessage}</div>
        )}
        <Link href={href} className="btn-secondary shrink-0 md:hidden mt-4 inline-flex w-full justify-center">
            View all stays <ArrowRight size={15} />
          </Link>
      </div>
    </section>
  );
}
