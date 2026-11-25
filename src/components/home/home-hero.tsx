import Image from "next/image";
import { HeroSearch } from "@/components/home/hero-search";
import type { CategoryRow, DestinationRow } from "@/types/database.types";

export function HomeHero({
  destinations,
  categories,
}: {
  destinations: DestinationRow[];
  categories: CategoryRow[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-deep">
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="Premium resort pool surrounded by tropical greenery"
          fill
          preload
          loading="eager"
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest  via-forest-deep/60 to-forest-deep/40" />
      </div>

      <div className="site-container relative flex min-h-[610px] flex-col justify-center pb-12 pt-16 text-white md:min-h-[680px] md:py-16">
        <div className="mx-auto max-w-[800px] text-center">
          <p className="eyebrow !text-gold">Kerala & beyond</p>
          <h1 className="display-title mt-5 text-[clamp(3rem,7vw,5rem)] uppercase leading-[1.3] ">
            Find Your Perfect Escape
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg md:text-xl  text-white/80">
            Discover beautiful resorts, villas, homestays and unique stays.
          </p>
          <div className="mt-7 hidden md:flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-[0.9rem] uppercase  text-white/80">
            <span>Curated stays</span>
            <span className="hidden h-8 w-[1px]  bg-gold sm:block" />
            <span>Verified owners</span>
            <span className="hidden h-8 w-[1px]  bg-gold sm:block" />
            <span>Easy enquiries</span>
          </div>
        </div>

        <div className="mx-auto  w-full max-w-5xl mt-10">
          <HeroSearch destinations={destinations} categories={categories} />
        </div>
      </div>
    </section>
  );
}
