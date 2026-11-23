import { addAmenityAction } from "@/app/admin/actions";
import { PlanForm } from "@/components/admin/plan-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminAmenities, getAdminPlans } from "@/lib/data/admin";

export default async function AdminSettingsPage() {
  const [plans, amenities] = await Promise.all([getAdminPlans(), getAdminAmenities()]);

  return (
    <>
      <p className="eyebrow">Configuration</p>
      <h1 className="display-title mt-3 text-4xl">Plans & amenities.</h1>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {plans.length ? (
          plans.map((plan) => (
            <section key={plan.id} className="surface-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">{plan.code} plan</p>
              <h2 className="mt-1 font-serif text-2xl text-forest-deep">{plan.name}</h2>
              <div className="mt-5"><PlanForm plan={plan} /></div>
            </section>
          ))
        ) : (
          <EmptyState title="No plans found" description="Run the seed SQL to create Free and Premium plans." />
        )}

        <section className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">Amenities</p>
          <h2 className="mt-1 font-serif text-2xl text-forest-deep">Property features</h2>
          <form action={addAmenityAction} className="mt-5 flex gap-2">
            <input name="name" required placeholder="New amenity name" className="input-field" />
            <button type="submit" className="btn-secondary shrink-0">Add</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {amenities.length ? (
              amenities.map((amenity) => (
                <span key={amenity.id} className="rounded-full border border-forest/12 px-3 py-1.5 text-xs text-forest">
                  {amenity.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted">No amenities yet.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
