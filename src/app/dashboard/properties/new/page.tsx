import { requireOwner } from "@/lib/auth/guards";
import { getAllAmenities, getCategories, getDestinations } from "@/lib/data/public";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { PropertyForm } from "@/components/dashboard/property-form";

export default async function NewPropertyPage() {
  const { user } = await requireOwner();
  const [destinations, categories, amenities, plan] = await Promise.all([
    getDestinations(),
    getCategories(),
    getAllAmenities(),
    getPlanContextForUser(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">New listing</p>
      <h1 className="display-title mt-3 text-4xl">Add a property.</h1>
      <p className="mt-3 text-sm text-muted">
        Your listing will be submitted for review. You can add photos after it is created.
      </p>
      {plan.entitlement === "admin_bypass" && (
        <p className="mt-5 rounded-lg bg-forest-deep px-4 py-3 text-sm text-white">
          {plan.limits.planName} — unlimited properties, photos and enhanced fields are available.
        </p>
      )}
      <div className="mt-8">
        <PropertyForm
          key="new-property"
          destinations={destinations}
          categories={categories}
          amenities={amenities}
          isPremium={plan.isPremium}
        />
      </div>
    </div>
  );
}
