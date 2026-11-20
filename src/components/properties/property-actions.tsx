"use client";

import { useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { useFavorite } from "@/components/properties/use-favorite";
import { cn } from "@/lib/utils";

export function PropertyActions({
  propertyId,
  propertyName,
  propertySlug,
}: {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
}) {
  const { isFavorite, toggle } = useFavorite(propertyId);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/properties/${propertySlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: propertyName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={isFavorite ? "Remove from saved stays" : "Save this stay"}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
          isFavorite
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-forest/12 text-forest hover:bg-sand/60",
        )}
      >
        <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        onClick={share}
        aria-label="Share this stay"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-forest/12 text-forest transition-colors hover:bg-sand/60"
      >
        {copied ? <Check size={15} /> : <Share2 size={15} />}
      </button>
    </div>
  );
}
