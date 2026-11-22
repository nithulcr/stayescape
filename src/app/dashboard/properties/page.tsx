import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Eye, Pencil, Trash2 } from "lucide-react";
import { deletePropertyAction } from "@/app/dashboard/properties/actions";
import { PropertyPublicationControls } from "@/components/dashboard/property-publication";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerProperties } from "@/lib/data/owner";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { canCreateProperty } from "@/lib/plans/property-limits";
import { fallbackPropertyImage } from "@/lib/media";
import { formatINR } from "@/lib/utils";

export default async function OwnerPropertiesPage() {
  const { user } = await requireOwner();
  const [properties, plan] = await Promise.all([
    getOwnerProperties(user.id),
    getPlanContextForUser(user.id),
  ]);
  const canAddProperty = canCreateProperty(properties.length, plan);
  const approvedProperties = properties
    .filter((property) => property.status === "approved")
    .map((property) => ({
      id: property.id,
      name: property.name,
      isPublished: property.is_published,
      publishAfterRenewal: property.publish_after_renewal,
    }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My properties</p>
          <h1 className="display-title mt-3 text-4xl">Manage your listings.</h1>
          <p className="mt-3 text-sm text-muted">
            {plan.isUnlimited
              ? `${properties.length} properties · ${plan.limits.planName}`
              : `${properties.length} of ${plan.limits.maxProperties} properties used on your ${plan.limits.planName} plan.`}
          </p>
          <p className="mt-2 text-xs text-muted">
            {plan.publishedCount} of {plan.publishedLimit} approved properties published.
          </p>
          {plan.status === "expired" && (
            <p className="mt-2 text-xs text-rose-700">
              Premium has expired. Keep one published property or upgrade to restore your previous listings.
            </p>
          )}
          {!canAddProperty && (
            <p className="mt-2 text-xs text-gold">
              You have reached your plan limit. Upgrade to add more properties.
            </p>
          )}
        </div>
        {canAddProperty ? (
          <Link href="/dashboard/properties/new" className="btn-primary">Add property</Link>
        ) : (
          <Link href="/dashboard/subscription" className="btn-primary">
            Upgrade to add more properties
          </Link>
        )}
      </div>

      <PropertyPublicationControls
        properties={approvedProperties}
        needsSelection={plan.needsPropertySelection}
      />

      {properties.length ? (
        <div className="mt-8 grid gap-5">
          {properties.map((property) => (
            <article key={property.id} className="surface-card flex flex-col gap-5 p-4 sm:flex-row sm:items-center">
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-sand sm:w-40">
                <Image
                  src={property.cover_image || fallbackPropertyImage}
                  alt={property.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-xl text-forest-deep">{property.name}</h2>
                  <StatusPill status={property.status} />
                  {property.status === "approved" && (
                    <StatusPill status={property.is_published ? "published" : "unpublished"}>
                      {property.is_published ? "Published" : "Unpublished"}
                    </StatusPill>
                  )}
                  {property.is_featured && <StatusPill status="premium">Featured</StatusPill>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {[property.district, property.city, property.state].filter(Boolean).join(", ") || "Location pending"}
                  {property.price_per_night ? ` · ${formatINR(property.price_per_night)} / night` : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
                  {property.short_description ?? "No description yet."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {property.status === "approved" && (
                  <Link href={`/properties/${property.slug}`} target="_blank" className="btn-secondary !px-3 !py-2">
                    <Eye size={14} /> View
                  </Link>
                )}
                <Link href={`/dashboard/properties/${property.id}`} className="btn-secondary !px-3 !py-2">
                  <Pencil size={14} /> Edit
                </Link>
                <form action={deletePropertyAction}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 size={14} /> Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Start with your first property"
            description="Add the essentials now; you can enrich the listing with photos and details later."
            actionLabel="Add a property"
            actionHref="/dashboard/properties/new"
            icon={<ArrowUpRight size={20} />}
          />
        </div>
      )}
    </>
  );
}
