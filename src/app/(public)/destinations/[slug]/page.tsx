import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { getDestinationBySlug, getDestinations, getPublishedProperties } from "@/lib/data/public";
import { media } from "@/lib/media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return { title: "Destination not found" };
  return {
    title: destination.seo_title ?? `Stays in ${destination.name}`,
    description: destination.seo_description ?? destination.short_description ?? undefined,
    alternates: { canonical: `/destinations/${destination.slug}` },
    openGraph: {
      title: destination.seo_title ?? `Stays in ${destination.name}`,
      description: destination.seo_description ?? destination.short_description ?? undefined,
      images: destination.image_url ? [destination.image_url] : undefined,
    },
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const [properties, destinations] = await Promise.all([
    getPublishedProperties({ destination: slug }, 6),
    getDestinations(),
  ]);
  const image = destination.image_url || (media[destination.slug as keyof typeof media] as string | undefined) || media.resort;

  return (
    <>
      <section className="relative isolate min-h-[440px] overflow-hidden bg-forest-deep">
        <Image src={image} alt={destination.name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/45 to-forest-deep/40" />
        <div className="site-container relative flex min-h-[440px] flex-col justify-end pb-12 pt-20 text-white">
          <Link href="/destinations" className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
            <ArrowLeft size={13} /> All destinations
          </Link>
          <p className="mt-6 text-[0.7rem] uppercase tracking-[0.22em] text-gold-soft">{destination.state}</p>
          <h1 className="display-title mt-2 text-[clamp(2.6rem,7vw,4.8rem)]">{destination.name}</h1>
          {destination.short_description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
              {destination.short_description}
            </p>
          )}
        </div>
      </section>

      <section className="section-space">
        <div className="site-container grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="eyebrow">About {destination.name}</p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-charcoal/75 md:text-base">
              {destination.description ?? destination.short_description ?? `Explore beautiful stays in ${destination.name}.`}
            </p>
          </div>
          <div className="surface-card p-6">
            <p className="text-xs uppercase tracking-wider text-gold">Stays available</p>
            <p className="mt-1 font-serif text-3xl text-forest-deep">{properties.total}</p>
            <p className="mt-2 text-xs text-muted">Reviewed and approved by STAYSCAPE.</p>
            <Link href={`/properties?destination=${destination.slug}`} className="btn-secondary mt-5 w-full">
              View all stays <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-space bg-sand/40 pt-0">
        <div className="site-container">
          <h2 className="section-title mb-7">Stays in {destination.name}</h2>
          {properties.items.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.items.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="surface-card px-6 py-12 text-center text-sm text-muted">
              No published stays in {destination.name} yet. Check back soon.
            </div>
          )}
        </div>
      </section>

      {destinations.length > 1 && (
        <section className="section-space bg-ivory">
          <div className="site-container">
            <h2 className="section-title mb-6">Explore nearby destinations</h2>
            <div className="flex flex-wrap gap-3">
              {destinations
                .filter((item) => item.id !== destination.id)
                .map((item) => (
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
