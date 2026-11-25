import Link from "next/link";
import { ArrowRight, Building2, Inbox, MessageSquareText, Sparkles } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { getAuthContext } from "@/lib/auth/guards";
import { getOwnerProperties, getOwnerStats, getOwnerSubscription } from "@/lib/data/owner";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { canCreateProperty } from "@/lib/plans/property-limits";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const context = await getAuthContext();
  if (!context) return null;
  const isOwner =
    context.profile?.role === "owner" ||
    context.profile?.role === "admin" ||
    context.profile?.role === "super_admin";

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Overview</p>
        <h1 className="display-title mt-3 text-3xl md:text-4xl">Welcome to STAYESCAPE.</h1>
        <p className="mt-4 text-sm text-muted">
          Your account is ready. Explore distinctive stays across Kerala, or switch to an owner account to list your own property.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/properties" className="surface-card p-6 transition-transform hover:-translate-y-0.5">
            <Sparkles size={22} className="text-gold" />
            <h2 className="mt-3 font-serif text-xl text-forest-deep">Explore stays</h2>
            <p className="mt-2 text-sm text-muted">Browse approved resorts, villas and homestays.</p>
          </Link>
          <Link href="/list-your-property" className="surface-card p-6 transition-transform hover:-translate-y-0.5">
            <Building2 size={22} className="text-gold" />
            <h2 className="mt-3 font-serif text-xl text-forest-deep">Become an owner</h2>
            <p className="mt-2 text-sm text-muted">Create an owner profile and publish your first listing.</p>
          </Link>
        </div>
      </div>
    );
  }

  const [stats, properties, subscription, plan] = await Promise.all([
    getOwnerStats(context.user.id),
    getOwnerProperties(context.user.id),
    getOwnerSubscription(context.user.id),
    getPlanContextForUser(context.user.id),
  ]);
  const canAddProperty = canCreateProperty(stats.total, plan);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="display-title mt-3 text-3xl md:text-4xl">Your properties at a glance.</h1>
          {!canAddProperty && (
            <p className="mt-2 text-xs text-gold">Free allows one property. Upgrade to add more.</p>
          )}
        </div>
        <Link href="/dashboard/properties/new" className="btn-secondary">
          Add a property <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total properties" value={stats.total} icon={Building2} />
        <StatCard label="Published" value={stats.published} icon={Sparkles} />
        <StatCard label="Pending property" value={stats.pending} icon={Inbox} />
        <StatCard label="Pending reviews" value={stats.pendingReviews} icon={MessageSquareText} />
        <StatCard label="Enquiries" value={stats.enquiries} icon={Inbox} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-forest/10 px-6 py-4">
            <h2 className="font-serif text-xl text-forest-deep">Recent properties</h2>
            <Link href="/dashboard/properties" className="text-sm font-semibold text-forest">View all</Link>
          </div>
          {properties.length ? (
            <div className="divide-y divide-forest/8">
              {properties.slice(0, 5).map((property) => (
                <div key={property.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <Link href={`/dashboard/properties/${property.id}`} className="block truncate text-sm font-semibold text-forest-deep hover:text-forest-soft">
                      {property.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {[property.city, property.state].filter(Boolean).join(", ") || "Location pending"}
                    </p>
                  </div>
                  <StatusPill status={property.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No properties yet"
                description="Create your first listing and submit it for admin review."
                actionLabel="Add a property"
                actionHref="/dashboard/properties/new"
              />
            </div>
          )}
        </section>

        <section className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            {plan.entitlement === "admin_bypass" ? "Access" : "Subscription"}
          </p>
          <p className="mt-2 font-serif text-2xl text-forest-deep">
            {plan.limits.planName}
          </p>
          <div className="mt-3">
            {plan.entitlement === "admin_bypass" ? (
              <StatusPill status="super_admin">Unlimited access</StatusPill>
            ) : (
              <StatusPill status={subscription?.status ?? "free"} />
            )}
          </div>
          {plan.entitlement === "admin_bypass" ? (
            <p className="mt-3 text-xs text-muted">All features are enabled by your administrator role.</p>
          ) : (
            subscription?.expires_at && (
              <p className="mt-3 text-xs text-muted">Valid until {formatDate(subscription.expires_at)}</p>
            )
          )}
          <Link href="/dashboard/subscription" className="btn-secondary mt-6 w-full">
            {plan.entitlement === "admin_bypass" ? "View access details" : "Manage subscription"}
          </Link>
        </section>
      </div>
    </>
  );
}
