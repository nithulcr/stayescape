"use client";

import Image from "next/image";
import { useState } from "react";
import { fallbackPropertyImage } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { PropertyDetail } from "@/types";

export function PropertyGallery({
  images,
  name,
  cover_image,
}: Pick<PropertyDetail, "images" | "name" | "cover_image">) {
  const slides = images.length ? images : [{ id: "fallback", public_url: cover_image, alt_text: name, is_cover: true }];
  const [active, setActive] = useState(0);
  const current = slides[active] ?? slides[0];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-sand">
        <Image
          key={current.id}
          src={current.public_url || fallbackPropertyImage}
          alt={current.alt_text || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 65vw"
          className="object-cover"
        />
      </div>
      {slides.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {slides.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-colors",
                index === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image src={image.public_url || fallbackPropertyImage} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
