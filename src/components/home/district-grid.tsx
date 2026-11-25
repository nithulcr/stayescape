import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { DistrictSummary } from "@/types";

export function DistrictGrid({ districts }: { districts: DistrictSummary[] }) {
  if (!districts.length) return null;

  return (
    <div className="mobile-card-slider gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-[-1.25rem] md:mx-0 px-[1.25rem] md:px-0">
      {districts.map((district) => (
        <Link
          key={district.slug}
          href={`/properties?district=${district.slug}`}
          className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand"
        >
          <Image
            src={district.image}
            alt={`Stays in ${district.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <span className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.18em] text-gold-soft">
              <MapPin size={12} /> {district.state}
            </span>
            <h3 className="mt-1.5 font-serif text-xl">{district.name}</h3>
            <p className="mt-1 text-xs text-white/70">
              {district.propertyCount} {district.propertyCount === 1 ? "stay" : "stays"} available
            </p>
          </div>
          <span className="absolute right-4 top-4 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-ivory/90 text-forest opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={20} />
          </span>
        </Link>
      ))}
    </div>
  );
}
