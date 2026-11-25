import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyActions } from "@/components/properties/property-actions";
import { EnquiryForm } from "@/components/properties/enquiry-form";
import { ReviewList } from "@/components/properties/review-list";
import { getAuthContext } from "@/lib/auth/guards";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/data/public";
import { guestReviewCookie, isValidGuestReviewId } from "@/lib/reviews/guest";
import { getCanonicalUrl, createNoIndexMetadata } from "@/lib/seo/metadata";
import {
  buildPropertyJsonLd,
  createPropertyMetadata,
  getPropertyBreadcrumbLinks,
} from "@/lib/seo/property";
import { formatINR, telephoneLink, whatsappLink } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return createNoIndexMetadata("Property not found");
  return createPropertyMetadata(property);
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string | string[] }>;
}) {
  const { slug } = await params;
  const { review } = await searchParams;
  const openComposer = Array.isArray(review) ? review.includes("1") : review === "1";
  const auth = await getAuthContext();
  const guestCookie = (await cookies()).get(guestReviewCookie)?.value;
  const guestToken = isValidGuestReviewId(guestCookie) ? guestCookie : null;
  const property = await getPropertyBySlug(slug, auth?.user.id, guestToken);
  if (!property) notFound();

  const similar = await getSimilarProperties(property, 3);
  const canReview = !auth?.user.id || auth.user.id !== property.owner_id;
  const callNumber = property.contact_phone ?? property.owner_phone;
  const whatsapp = whatsappLink(
    property.whatsapp_number ?? property.owner_whatsapp ?? callNumber,
    `Hi, I'm interested in ${property.name}. Could you please share availability and more details?`,
  );
  const callOwner = telephoneLink(callNumber);
  const canonicalUrl = getCanonicalUrl(`/properties/${property.slug}`);
  const jsonLd = canonicalUrl ? buildPropertyJsonLd({ property, canonicalUrl }) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <div className="site-container py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-between">
          <nav aria-label="Breadcrumb" className="mb-5 text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            {getPropertyBreadcrumbLinks(property).map((crumb, index, links) => (
              <li key={crumb.path} className="flex items-center gap-2">
                {index < links.length - 1 ? (
                  <Link href={crumb.path} className="hover:text-forest">
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-forest-deep">
                    {crumb.name}
                  </span>
                )}
                {index < links.length - 1 && <ChevronRight size={12} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </nav>

        <Link href="/properties" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-forest">
          <ArrowLeft size={13} /> Back to all stays
        </Link>
        </div>

        <div className="mt-6 grid gap-9 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {property.category_name && property.category_slug && (
                <Link
                  href={`/categories/${property.category_slug}`}
                  className="rounded-full bg-[#f2eee4] px-3 py-1 border text-[0.68rem] font-semibold uppercase tracking-wider text-forest hover:underline"
                >
                  {property.category_name}
                </Link>
              )}
              {property.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full uppercase bg-gold/20 border px-3 py-1 text-[0.68rem] font-semibold text-gold">
                  <Star size={11} fill="currentColor" /> Featured
                </span>
              )}
              {property.review_count > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-3 py-1 text-[0.68rem] font-semibold text-forest">
                  <Star size={11} fill="currentColor" className="text-gold" />
                  {property.rating_average?.toFixed(1)} ({property.review_count})
                </span>
              )}
              <PropertyActions
                propertyId={property.id}
                propertyName={property.name}
                propertySlug={property.slug}
              />
            </div>
            <h1 className="display-title text-[clamp(2.2rem,5vw,3rem)]">{property.name}</h1>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
              <MapPin size={15} className="text-gold" />
              {[property.district, property.city, property.state].filter(Boolean).join(", ") || "Location on request"}
            </p>
            {property.destination_slug && property.city && (
              <Link
                href={`/destinations/${property.destination_slug}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
              >
                Explore stays in {property.city} <ArrowRight size={12} />
              </Link>
            )}

            <div className="mt-7">
              <PropertyGallery property={property} />
            </div>

            <section className="mt-10">
              <h2 className="section-title !text-2xl">About this stay</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-charcoal/75 md:text-base">
                {property.description ?? property.short_description ?? "Details will be shared by the property owner."}
              </p>
            </section>

            {property.highlights.length > 0 && (
              <section className="mt-9">
                <h2 className="section-title !text-2xl">Highlights</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {property.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2 rounded-lg bg-sand/50 px-4 py-3 text-sm text-charcoal/80">
                      <Check size={15} className="mt-0.5 shrink-0 text-gold" /> {highlight}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {property.amenities.length > 0 && (
              <section className="mt-9">
                <h2 className="section-title !text-2xl">Amenities</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span key={amenity.id} className="rounded-full border border-forest/12 px-3 py-1.5 text-xs text-forest">
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(property.check_in_time || property.check_out_time) && (
              <section className="mt-9 flex flex-wrap gap-6 rounded-xl bg-sand/50 p-5 text-sm">
                {property.check_in_time && (
                  <span className="inline-flex items-center gap-2 text-charcoal/75">
                    <Clock3 size={15} className="text-gold" /> Check-in: {property.check_in_time}
                  </span>
                )}
                {property.check_out_time && (
                  <span className="inline-flex items-center gap-2 text-charcoal/75">
                    <Clock3 size={15} className="text-gold" /> Check-out: {property.check_out_time}
                  </span>
                )}
              </section>
            )}

            <ReviewList
              propertyId={property.id}
              reviews={property.reviews}
              currentUserId={auth?.user.id}
              guestToken={guestToken}
              canReview={canReview}
              openComposer={openComposer}
            />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="surface-card p-6">
              <p className="text-xs uppercase tracking-wider text-gold">
                {property.price_per_night ? "Starting from" : "Tariff"}
              </p>
              <p className="mt-1 font-serif text-3xl text-forest-deep">
                {formatINR(property.price_per_night)}
                {property.price_per_night && <span className="ml-1 text-sm font-sans text-muted">/ night</span>}
              </p>
              {property.owner_name && (
                <div className="mt-5 flex items-center gap-3 border-t border-forest/10 pt-5">
                  {property.owner_avatar ? (
                    <Image src={property.owner_avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm text-white">
                      {property.owner_name.charAt(0)}
                    </span>
                  )}
                  <span>
                    <span className="block text-xs text-muted">Hosted by</span>
                    <span className="block text-sm font-semibold text-forest-deep">{property.owner_name}</span>
                  </span>
                </div>
              )}
              <div className="mt-5 grid gap-2">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1EBE57]"
                  >
                    <MessageCircle size={16} /> Chat on WhatsApp
                  </a>
                )}
                {callOwner && (
                  <a href={callOwner} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-soft">
                    <Phone size={16} /> Call Owner
                  </a>
                )}
              </div>
            </div>
           
            
            <EnquiryForm
              propertyId={property.id}
              propertyName={property.name}
              priceOnRequest={!property.price_per_night}
            />

            {(property.contact_email || property.website_url) && (
              <div className="surface-card p-5 text-xs">
                {property.contact_email && (
                  <a href={`mailto:${property.contact_email}`} className="mb-2 flex items-center gap-2 text-muted hover:text-forest">
                    <Mail size={14} /> {property.contact_email}
                  </a>
                )}
                {property.website_url && (
                  <a href={property.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted hover:text-forest">
                    <Globe2 size={14} /> Visit website
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="section-space bg-light-ivory">
          <div className="site-container">
            <h2 className="section-title mb-7">You might also like</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
