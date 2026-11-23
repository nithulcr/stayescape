import Link from "next/link";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerStats } from "@/lib/data/owner";
import { getAllAmenities, getCategories, getDestinations } from "@/lib/data/public";
import { getPlanContextForUser, getPlanLimits } from "@/lib/plans/limits";
import { canCreateProperty } from "@/lib/plans/property-limits";
import { PropertyForm } from "@/components/dashboard/property-form";

export default async function NewPropertyPage() {
  const { user } = await requireOwner();
  const [destinations, categories, amenities, plan, stats, planLimits] = await Promise.all([
    getDestinations(),
    getCategories(),
    getAllAmenities(),
    getPlanContextForUser(user.id),
    getOwnerStats(user.id),
    getPlanLimits(),
  ]);
  const canAddProperty = canCreateProperty(stats.total, plan);

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
      {canAddProperty ? (
        <div className="mt-8">
          <PropertyForm
            key="new-property"
            destinations={destinations}
            categories={categories}
            amenities={amenities}
            isPremium={plan.isPremium}
          />
        </div>
      ) : (
        <div className="surface-card mt-8 p-7">
          <p className="font-serif text-2xl text-forest-deep">You have reached your plan limit.</p>
          <p className="mt-2 text-sm text-muted">
            Your {plan.limits.planName} plan allows {plan.limits.maxProperties} properties. Upgrade to Premium to manage up to {planLimits.premium.maxProperties} properties on your owner account.
          </p>
          <Link href="/dashboard/subscription" className="btn-secondary mt-6">View upgrade options</Link>
        </div>
      )}
    </div>
  );
}
