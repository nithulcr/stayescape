import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { media } from "@/lib/media";
import type { DestinationRow } from "@/types/database.types";

export function DestinationGrid({
  destinations,
  limit,
  slider = false,
}: {
  destinations: DestinationRow[];
  limit?: number;
  slider?: boolean;
}) {
  const visibleDestinations = typeof limit === "number" ? destinations.slice(0, limit) : destinations;

  if (!visibleDestinations.length) {
    return (
      <div className="surface-card px-6 py-12 text-center">
        <p className="text-sm text-muted">Destinations will appear here once the database is seeded.</p>
        <Link href="/destinations" className="btn-secondary mt-5">
          View destinations <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={
        slider
          ? "mobile-card-slider gap-5 sm:grid-cols-2 lg:grid-cols-4 "
          : "grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      {visibleDestinations.map((destination, index) => {
        const image =
          destination.image_url || (media[destination.slug as keyof typeof media] as string | undefined) || media.resort;
        return (
          <Link
            key={destination.id}
            href={`/destinations/${destination.slug}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-sand"
          >
            <Image
              src={image}
              alt={destination.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="text-[0.62rem] uppercase tracking-[0.2em] text-gold-soft">
                {String(index + 1).padStart(2, "0")} / {destination.state}
              </span>
              <h3 className="mt-1.5 font-serif text-xl">{destination.name}</h3>
              {destination.short_description && (
                <p className="mt-2 line-clamp-2 text-xs text-white/80">{destination.short_description}</p>
              )}
            </div>
            <span className="absolute right-4 top-4 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-ivory/90 text-forest opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
