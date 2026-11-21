import { Suspense } from "react";
import { HomeHero } from "@/components/home/home-hero";
import { DestinationGrid } from "@/components/home/destination-grid";
import { CategoryGrid } from "@/components/home/category-grid";
import { PropertySection } from "@/components/home/property-section";
import { WhyList } from "@/components/home/why-list";
import { Testimonials } from "@/components/home/testimonials";
import { OwnerCta } from "@/components/home/owner-cta";
import { Reveal } from "@/components/ui/reveal";
import {
  getCategories,
  getDestinations,
  getFeaturedProperties,
  getRecentlyAddedProperties,
  getTopRatedProperties,
} from "@/lib/data/public";

export default async function HomePage() {
  const [destinations, categories, featured, topRated, recent] = await Promise.all([
    getDestinations(),
    getCategories(),
    getFeaturedProperties(6),
    getTopRatedProperties(6),
    getRecentlyAddedProperties(3),
  ]);

  return (
    <>
      <HomeHero destinations={destinations} categories={categories} />

      <section className="section-space">
        <div className="site-container">
          <Reveal>
            <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="eyebrow">Where to next</p>
                <h2 className="section-title mt-3">Popular destinations.</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                  From cool hill stations to sunlit backwaters, find the corner of Kerala that feels like yours.
                </p>
              </div>
              <a href="#property-types" className="btn-secondary">Explore by type</a>
            </div>
          </Reveal>
          <Suspense fallback={null}>
            <DestinationGrid destinations={destinations} limit={8} />
          </Suspense>
        </div>
      </section>

      <div className="bg-light-ivory">
        <PropertySection
        items={featured}
        eyebrow="Editor's picks"
        title="Featured stays."
        description="A small selection of places we love for their setting, character and hospitality."
      />
      </div>

      <PropertySection
        items={topRated}
        eyebrow="Guest favourites"
        title="Top rated stays."
        description="The stays travellers rate highest for comfort, character and hospitality."
        emptyMessage="Top rated stays will appear here once guests have reviewed their visits."
      />

      <section id="property-types" className="section-space bg-light-ivory">
        <div className="site-container">
          <Reveal>
            <div className="mb-9 max-w-3xl">
              <p className="eyebrow">Stay your way</p>
              <h2 className="section-title mt-3">Explore property types.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted md:text-base max-w-xl">
                Whether it is a tea estate bungalow or a private villa by the backwaters, there is a stay for every kind of escape.
              </p>
            </div>
          </Reveal>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      <PropertySection
        items={recent}
        eyebrow="Just added"
        title="Fresh on STAYSCAPE."
        description="Newly approved properties looking for their first guests through the platform."
      />

      <WhyList />
      <Testimonials />
      <OwnerCta />
    </>
  );
}
