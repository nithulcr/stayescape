import Link from "next/link";
import { notFound } from "next/navigation";
import { savePropertyAdminAction } from "@/app/admin/actions";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { PropertyForm } from "@/components/dashboard/property-form";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getAdminAmenities,
  getAdminCategories,
  getAdminDestinations,
  getAdminPropertyAmenityIds,
  getAdminPropertyById,
  getAdminPropertyImages,
  getPropertyOwnerCandidates,
} from "@/lib/data/admin";
import { getPlanContextForUser } from "@/lib/plans/limits";

export default async function AdminPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireAdmin();
  const property = await getAdminPropertyById(id);
  if (!property) notFound();

  const [destinations, categories, amenities, plan, images, amenityIds, owners] = await Promise.all([
    getAdminDestinations(),
    getAdminCategories(),
    getAdminAmenities(),
    getPlanContextForUser(property.owner_id),
    getAdminPropertyImages(property.id),
    getAdminPropertyAmenityIds(property.id),
    getPropertyOwnerCandidates(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Edit property</p>
          <h1 className="display-title mt-3 text-4xl">{property.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={property.status} />
          <Link href={`/properties/${property.slug}`} target="_blank" className="btn-secondary !py-2">
            View public listing
          </Link>
        </div>
      </div>
      {property.rejection_reason && (
        <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Review feedback: {property.rejection_reason}
        </p>
      )}
      <div className="mt-8 grid gap-6">
        <PropertyForm
          key={property.id}
          property={property}
          destinations={destinations}
          categories={categories}
          amenities={amenities}
          isPremium={plan.isPremium}
          selectedAmenityIds={amenityIds}
          saveAction={savePropertyAdminAction}
          adminMode
          owners={owners}
          selectedOwnerId={property.owner_id}
          redirectBase="/admin/properties"
        />
        <ImageUploader
          propertyId={property.id}
          images={images}
          maxImages={plan.limits.maxImagesPerProperty}
          adminMode
          unlimited={plan.isUnlimited}
        />
      </div>
      <p className="mt-6 text-xs text-muted">Editing as {user.email ?? "administrator"}.</p>
    </div>
  );
}
