import { createPropertyAdminAction } from "@/app/admin/actions";
import { PropertyForm } from "@/components/dashboard/property-form";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getAdminAmenities,
  getAdminCategories,
  getAdminDestinations,
  getPropertyOwnerCandidates,
} from "@/lib/data/admin";
import { getPlanContextForUser } from "@/lib/plans/limits";

export default async function NewAdminPropertyPage() {
  const { user } = await requireAdmin();
  const [destinations, categories, amenities, owners, plan] = await Promise.all([
    getAdminDestinations(),
    getAdminCategories(),
    getAdminAmenities(),
    getPropertyOwnerCandidates(),
    getPlanContextForUser(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Admin tools</p>
      <h1 className="display-title mt-3 text-4xl">Add a property.</h1>
      <p className="mt-3 text-sm text-muted">
        Create a listing directly from the admin console and choose which account owns it. Photos can be added after creation.
      </p>
      {plan.entitlement === "admin_bypass" && (
        <p className="mt-5 rounded-lg bg-forest-deep px-4 py-3 text-sm text-white">
          {plan.limits.planName} — unlimited properties, photos and enhanced fields are available.
        </p>
      )}
      <div className="mt-8">
        <PropertyForm
          key="new-admin-property"
          destinations={destinations}
          categories={categories}
          amenities={amenities}
          isPremium={plan.isPremium}
          saveAction={createPropertyAdminAction}
          adminMode
          owners={owners}
          selectedOwnerId={user.id}
          redirectBase="/admin/properties"
        />
      </div>
    </div>
  );
}
