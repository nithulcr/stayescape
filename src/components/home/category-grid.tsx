import Image from "next/image";
import Link from "next/link";

import { media } from "@/lib/media";
import type { CategoryRow } from "@/types/database.types";

const images = [media.resort, media.villa, media.homestay, media.backwaters, media.forest, media.heritage, media.beach, media.tea];

export function CategoryGrid({ categories }: { categories: CategoryRow[] }) {
  if (!categories.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.slice(0, 8).map((category, index) => {
        
        return (
          <Link
            key={category.id}
            href={`/properties?category=${category.slug}`}
            className="group surface-card flex flex-col aspect-5/4 transition-transform hover:-translate-y-0.5 relative"
          >
            <div className="relative shrink-0  w-full h-full overflow-hidden rounded-lg bg-sand">
              <Image
                src={images[index % images.length]}
                alt=""
                width={400}
                height={400}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/00  to-forest-deep/90" />
            </div>
            <span className="p-4 z-10 flex flex-col justify-end h-full absolute top-0 left-0 w-full gap-3">
             
              <h3 className="mt-1 truncate font-serif text-lg font-light text-white">{category.name}</h3>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
