import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { setUserRoleAction, setUserStatusAction } from "@/app/admin/actions";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminUserById } from "@/lib/data/admin";
import { getAuthContext, isSuperAdminRole } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

const roleOptions = [
  { value: "user", label: "User" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
];

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, context] = await Promise.all([getAdminUserById(id), getAuthContext()]);
  if (!data) notFound();

  const { profile, properties, subscription } = data;
  const isSelf = context?.user.id === profile.id;
  const canManageRoles = isSuperAdminRole(context?.profile?.role);
  const isPrivileged = profile.role === "admin" || profile.role === "super_admin";
  const statusLocked = isSelf || (isPrivileged && !canManageRoles);

  return (
    <>
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-forest">
        <ArrowLeft size={14} /> All users
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-title text-4xl">{profile.full_name ?? "Unnamed user"}</h1>
          <p className="mt-2 text-sm text-muted">{profile.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={profile.role} />
            <StatusPill status={profile.account_status} />
            <span className="text-xs text-muted">Joined {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="surface-card p-6">
          <h2 className="font-serif text-lg text-forest-deep">Contact</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
              <dd className="mt-0.5 text-forest-deep">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Phone</dt>
              <dd className="mt-0.5 text-forest-deep">{profile.phone ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="surface-card p-6">
          <h2 className="font-serif text-lg text-forest-deep">Subscription</h2>
          {subscription ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Plan</dt>
                <dd className="mt-0.5 text-forest-deep">{subscription.plan_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Status</dt>
                <dd className="mt-0.5">
                  <StatusPill status={subscription.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Expires</dt>
                <dd className="mt-0.5 text-forest-deep">
                  {subscription.expires_at ? formatDate(subscription.expires_at) : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">No subscription on record.</p>
          )}
        </section>

        <section className="surface-card p-6">
          <h2 className="font-serif text-lg text-forest-deep">Access control</h2>
          {canManageRoles && !isSelf ? (
            <form action={setUserRoleAction} className="mt-4 flex gap-2">
              <input type="hidden" name="userId" value={profile.id} />
              <select name="role" defaultValue={profile.role} className="input-field !w-auto">
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary">
                Save role
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted">
              {isSelf
                ? "You cannot change your own role or status."
                : "Only a super admin can change administrator roles."}
            </p>
          )}

          {!statusLocked && (
            <form action={setUserStatusAction} className="mt-4 flex gap-2">
              <input type="hidden" name="userId" value={profile.id} />
              <select name="status" defaultValue={profile.account_status} className="input-field !w-auto">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <button type="submit" className="btn-secondary">
                Save status
              </button>
            </form>
          )}
        </section>
      </div>

      <section className="surface-card mt-8 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-forest-deep">Properties</h2>
          <span className="text-xs text-muted">{properties.length} total</span>
        </div>
        {properties.length ? (
          <ul className="mt-4 divide-y divide-forest/10">
            {properties.map((property) => (
              <li key={property.id} className="flex items-center justify-between gap-3 py-3">
                <Link
                  href={`/admin/properties/${property.id}`}
                  className="truncate text-sm font-medium text-forest-deep hover:underline"
                >
                  {property.name}
                </Link>
                <StatusPill status={property.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">This user has not submitted any properties.</p>
        )}
      </section>
    </>
  );
}
