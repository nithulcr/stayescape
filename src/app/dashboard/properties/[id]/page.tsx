import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth/guards";
import { getAllAmenities, getCategories, getDestinations } from "@/lib/data/public";
import { getPropertyImages } from "@/lib/data/owner";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { getServerClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/dashboard/property-form";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { StatusPill } from "@/components/ui/status-pill";
import type { PropertyRow } from "@/types/database.types";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireOwner();
  const supabase = await getServerClient();
  if (!supabase) notFound();

  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  const property = data as PropertyRow | null;
  if (!property) notFound();

  const [destinations, categories, amenities, plan, images, amenityLinks] = await Promise.all([
    getDestinations(),
    getCategories(),
    getAllAmenities(),
    getPlanContextForUser(user.id),
    getPropertyImages(property.id, user.id),
    supabase.from("property_amenities").select("amenity_id").eq("property_id", property.id),
  ]);

  const selectedAmenityIds = (amenityLinks.data ?? []).map((link) => link.amenity_id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Edit listing</p>
          <h1 className="display-title mt-3 text-3xl md:text-4xl">{property.name}</h1>
        </div>
        <StatusPill status={property.status} />
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
          selectedAmenityIds={selectedAmenityIds}
        />
        <ImageUploader
          propertyId={property.id}
          images={images}
          maxImages={plan.limits.maxImagesPerProperty}
          unlimited={plan.isUnlimited}
        />
      </div>
    </div>
  );
}
