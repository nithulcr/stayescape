import Link from "next/link";
import { ArrowUpRight, Building2, CreditCard, Crown, Inbox, Mail, Users, XCircle } from "lucide-react";
import { getAdminStats } from "@/lib/data/admin";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";

const quickLinks = [
  { href: "/admin/properties", label: "Review properties" },
  { href: "/admin/destinations", label: "Manage destinations" },
  { href: "/admin/categories", label: "Manage categories" },
  { href: "/admin/settings", label: "Plan settings" },
];

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <>
      <p className="eyebrow">Overview</p>
      <h1 className="display-title mt-3 text-4xl">Platform health.</h1>
      <p className="mt-3 text-sm text-muted">
        {stats ? "Live counts from Supabase." : "Supabase is not configured yet. Add environment variables to load live data."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={stats?.users ?? "—"} icon={Users} />
        <StatCard label="Owners" value={stats?.owners ?? "—"} icon={Users} />
        <StatCard label="Properties" value={stats?.properties ?? "—"} icon={Building2} />
        <StatCard label="Pending review" value={stats?.pending ?? "—"} icon={Inbox} />
        <StatCard label="Approved" value={stats?.approved ?? "—"} icon={Building2} />
        <StatCard label="Rejected" value={stats?.rejected ?? "—"} icon={XCircle} />
        <StatCard label="Enquiries" value={stats?.enquiries ?? "—"} icon={Mail} />
        <StatCard label="Active subscriptions" value={stats?.activeSubscriptions ?? "—"} icon={Crown} />
        <StatCard label="Premium subscribers" value={stats?.premiumSubscribers ?? "—"} icon={Crown} />
        <StatCard label="Revenue" value={stats ? `₹${Math.round(stats.revenue).toLocaleString("en-IN")}` : "—"} icon={CreditCard} />
      </div>

      {stats && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="surface-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-forest-deep">Recent registrations</h2>
              <Link href="/admin/users" className="text-xs text-forest hover:underline">
                View all
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-forest/10">
              {stats.recentUsers.length === 0 && <li className="py-3 text-sm text-muted">No users yet.</li>}
              {stats.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-forest-deep">{user.full_name ?? "—"}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <StatusPill status={user.role} />
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-forest-deep">Recent submissions</h2>
              <Link href="/admin/properties" className="text-xs text-forest hover:underline">
                Review
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-forest/10">
              {stats.recentProperties.length === 0 && <li className="py-3 text-sm text-muted">No properties yet.</li>}
              {stats.recentProperties.map((property) => (
                <li key={property.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-forest-deep">{property.name}</p>
                    <p className="truncate text-xs text-muted">
                      {property.owner_name} · {formatDate(property.created_at)}
                    </p>
                  </div>
                  <StatusPill status={property.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <section className="surface-card mt-8 p-6">
        <h2 className="font-serif text-xl text-forest-deep">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg border border-forest/10 px-4 py-3 text-sm text-forest hover:bg-forest/5">
              {link.label} <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
