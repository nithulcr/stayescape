"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
  Star,
} from "lucide-react";
import { useFavorite } from "@/components/properties/use-favorite";
import { fallbackPropertyImage } from "@/lib/media";
import { cn, formatINR } from "@/lib/utils";
import type { PropertyListItem } from "@/types";

export function PropertyCard({ property }: { property: PropertyListItem }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const { isFavorite, toggle } = useFavorite(property.id);

  const images = property.images.length
    ? [...property.images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover))
    : [];
  const currentImage = images[Math.min(activeImage, Math.max(images.length - 1, 0))];
  const imageSrc = currentImage?.public_url || property.cover_image || fallbackPropertyImage;
  const isTopRated = (property.rating_average ?? 0) >= 4.5 && property.review_count >= 3;

  async function share() {
    const url = `${window.location.origin}/properties/${property.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  }

  function move(direction: number) {
    if (images.length < 2) return;
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  return (
    <article className="group surface-card overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-24px_rgba(18,61,50,0.35)]">
      <div className="relative aspect-[5/3] overflow-hidden bg-sand">
        <Link
          href={`/properties/${property.slug}`}
          className="absolute inset-0 z-0 "
          aria-label={`View ${property.name}`}
        >
          <Image
            src={imageSrc}
            alt={currentImage?.alt_text || property.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700  group-hover:scale-105"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {isTopRated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F1FBF4] border border-[#F1FBF4 text-gold px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider  backdrop-blur">
                <Star size={10} fill="#ffd700" stroke="#ffd700" /> Top rated
              </span>
            )}
            {!isTopRated && property.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F1FBF4] border border-[#F1FBF4] text-gold px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider  backdrop-blur">
                <Star size={10} fill="#ffd700"  /> Featured
              </span>
            )}
          </div>
          <div className="pointer-events-auto flex gap-1.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={isFavorite ? "Remove from saved stays" : "Save this stay"}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full bg-ivory/95 backdrop-blur transition-colors",
                isFavorite ? "text-rose-600" : "text-forest hover:text-rose-600",
              )}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="Share this stay"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ivory/95 text-forest backdrop-blur transition-colors hover:text-forest-soft"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
            </button>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-forest opacity-0 transition-opacity hover:bg-ivory group-hover:opacity-100"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-forest opacity-0 transition-opacity hover:bg-ivory group-hover:opacity-100"
            >
              <ChevronRight size={15} />
            </button>
            <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1.5 pb-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  className={cn(
                    "h-1.5 rounded-full bg-ivory/70 transition-all",
                    index === Math.min(activeImage, images.length - 1) ? "w-5 bg-ivory" : "w-1.5",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.68rem] font-medium uppercase tracking-wider text-gold">
          <span>{property.category_name ?? "Unique stay"}</span>
          <span className="text-forest">
            {property.price_per_night ? `${formatINR(property.price_per_night)} / night` : "Price on request"}
          </span>
        </div>

        <h3 className="mt-2 font-serif text-xl text-forest-deep">
          <Link href={`/properties/${property.slug}`} className="transition-colors hover:text-forest-soft ">
            {property.name}
          </Link>
        </h3>

        {property.rating_average !== null && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
            <Star size={12} fill="currentColor" className="text-gold" />
            <span className="font-semibold text-forest-deep">{property.rating_average.toFixed(1)}</span>
            <span>({property.review_count} review{property.review_count === 1 ? "" : "s"})</span>
          </p>
        )}

        {/* <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {property.short_description ?? "A distinctive stay waiting to be discovered."}
        </p> */}

        {property.amenities.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5 ">
            {property.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity.id} className="rounded-full bg-sand/60 px-2.5 py-1 text-[0.68rem] text-forest">
                {amenity.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-forest/8 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <MapPin size={13} className="text-gold" />
            {[property.district, property.city, property.state].filter(Boolean).join(", ") || "Location on request"}
          </span>
          <Link
            href={`/properties/${property.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest transition-all group-hover:gap-2"
          >
            View stay <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
