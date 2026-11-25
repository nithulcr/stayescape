import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getApprovedPublishedDestinationProperties,
  getApprovedPublishedProperties,
  getCategories,
  getDestinationBySlug,
  getDestinations,
} from "@/lib/data/public";
import { media } from "@/lib/media";
import {
  buildDestinationJsonLd,
  deriveDestinationAmenities,
  deriveDestinationCategories,
  deriveRelatedDestinations,
  getDestinationDescription,
  getDestinationTitle,
  isDestinationIndexable,
} from "@/lib/seo/destination";
import { createNoIndexMetadata, createPageMetadata, getCanonicalUrl } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return createNoIndexMetadata("Destination not found");

  const { total } = await getApprovedPublishedProperties({ destination: slug }, 1);

  return createPageMetadata({
    title: getDestinationTitle(destination),
    description: getDestinationDescription(destination),
    path: `/destinations/${destination.slug}`,
    image: destination.image_url,
    indexable: isDestinationIndexable(destination, total),
  });
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [destination, result, destinations, categories, relationProperties] = await Promise.all([
    getDestinationBySlug(slug),
    getApprovedPublishedProperties({ destination: slug }, 12),
    getDestinations(),
    getCategories(),
    getApprovedPublishedDestinationProperties(),
  ]);
  if (!destination) notFound();

  const properties = result.items;
  const canonicalUrl = getCanonicalUrl(`/destinations/${destination.slug}`);
  const intro =
    destination.description?.trim() ||
    destination.short_description?.trim() ||
    "Destination information is not available yet. Add a verified short description or full description for this destination.";
  const heroDescription = destination.short_description?.trim();
  const categoryLinks = deriveDestinationCategories(properties, categories);
  const amenityLinks = deriveDestinationAmenities(properties);
  const related = deriveRelatedDestinations(destination, destinations, relationProperties);
  const jsonLd = canonicalUrl
    ? buildDestinationJsonLd({ destination, canonicalUrl, properties })
    : null;
  const image =
    destination.image_url ||
    (media[destination.slug as keyof typeof media] as string | undefined) ||
    media.resort;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <section className="relative isolate min-h-[440px] overflow-hidden bg-forest-deep">
        <Image src={image} alt={destination.name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/45 to-forest-deep/40" />
        <div className="site-container relative flex min-h-[440px] flex-col justify-end pb-12 pt-20 text-white">
          <nav aria-label="Breadcrumb" className="mb-8 text-xs text-white/70">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true"><ChevronRight size={12} /></li>
              <li><Link href="/destinations" className="hover:text-white">Destinations</Link></li>
              <li aria-hidden="true"><ChevronRight size={12} /></li>
              <li aria-current="page" className="text-white">{destination.name}</li>
            </ol>
          </nav>
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-soft">{destination.state}</p>
          <h1 className="display-title mt-2 text-[clamp(2.6rem,7vw,4.8rem)]">{destination.name}</h1>
          {heroDescription && heroDescription !== intro && (
            <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">{heroDescription}</p>
          )}
        </div>
      </section>

      <section className="section-space">
        <div className="site-container grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="eyebrow">About {destination.name}</p>
            <p className="mt-4 max-w-3xl text-sm text-charcoal/75 md:text-base">{intro}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-xs uppercase tracking-wider text-gold">Approved stays available</p>
            <p className="mt-1 font-serif text-3xl text-forest-deep">{result.total}</p>
            <p className="mt-2 text-xs text-muted">Publicly published and approved by STAYESCAPE.</p>
            <Link href={`/properties?destination=${destination.slug}`} className="btn-secondary mt-5 w-full">
              View all stays <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {categoryLinks.length > 0 && (
        <section className="section-space bg-light-ivory pt-0">
          <div className="site-container">
            <h2 className="section-title mb-6">Stay types in {destination.name}</h2>
            <div className="flex flex-wrap gap-3">
              {categoryLinks.map((category) => (
                <Link
                  key={category.slug}
                  href={`/properties?destination=${destination.slug}&category=${category.slug}`}
                  className="btn-secondary"
                >
                  {category.name} <span className="text-muted">({category.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {amenityLinks.length > 0 && (
        <section className="section-space bg-light-ivory pt-0">
          <div className="site-container">
            <h2 className="section-title mb-6">Amenities reported by listed stays</h2>
            <div className="flex flex-wrap gap-3">
              {amenityLinks.map((amenity) => (
                <Link
                  key={amenity.id}
                  href={`/properties?destination=${destination.slug}&amenity=${amenity.id}`}
                  className="btn-secondary"
                >
                  {amenity.name} <span className="text-muted">({amenity.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-space bg-light-ivory pt-0">
        <div className="site-container">
          <h2 className="section-title mb-7">Approved stays in {destination.name}</h2>
          {properties.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No approved stays in ${destination.name} yet`}
              description="Published listings appear here after admin approval. Browse all approved stays in the meantime."
              actionLabel="View all stays"
              actionHref="/properties"
            />
          )}
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="section-space bg-ivory">
          <div className="site-container">
            <h2 className="section-title mb-6">
              {related.basedOnSharedDistrict ? "Related destinations" : "Other destinations"}
            </h2>
            <div className="flex flex-wrap gap-3">
              {related.items.map((item) => (
                <Link key={item.id} href={`/destinations/${item.slug}`} className="btn-secondary">
                  {item.name} <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
