import Link from "next/link";
import { setUserRoleAction, setUserStatusAction } from "@/app/admin/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAllUsers } from "@/lib/data/admin";
import { getAuthContext, isSuperAdminRole } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

const roleOptions = [
  { value: "user", label: "User" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const { q, role, status } = await searchParams;
  const [users, context] = await Promise.all([getAllUsers({ q, role, status }), getAuthContext()]);
  const canManageRoles = isSuperAdminRole(context?.profile?.role);
  const viewerId = context?.user.id;

  return (
    <>
      <p className="eyebrow">Accounts</p>
      <h1 className="display-title mt-3 text-4xl">Users.</h1>
      <p className="mt-3 text-sm text-muted">
        {canManageRoles
          ? "As a super admin you can assign roles, including administrator access."
          : "Roles are controlled only by a super admin. You can suspend regular accounts."}
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Search
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name or email"
            className="input-field !w-56"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Role
          <select name="role" defaultValue={role ?? ""} className="input-field !w-40">
            <option value="">All roles</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Status
          <select name="status" defaultValue={status ?? ""} className="input-field !w-40">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
        <Link href="/admin/users" className="text-xs text-muted hover:text-forest">
          Reset
        </Link>
      </form>

      {users.length ? (
        <div className="surface-card mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Properties</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/8">
              {users.map((user) => {
                const isSelf = user.id === viewerId;
                const isPrivileged = user.role === "admin" || user.role === "super_admin";
                const statusLocked = isSelf || (isPrivileged && !canManageRoles);
                return (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${user.id}`} className="font-medium text-forest-deep hover:underline">
                        {user.full_name ?? "Unnamed user"}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={user.account_status} />
                    </td>
                    <td className="px-5 py-4 text-forest-deep">{user.property_count}</td>
                    <td className="px-5 py-4 text-xs text-muted">{user.plan_name ?? "—"}</td>
                    <td className="px-5 py-4 text-xs text-muted">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {canManageRoles && !isSelf && (
                          <form action={setUserRoleAction} className="flex gap-1">
                            <input type="hidden" name="userId" value={user.id} />
                            <select name="role" defaultValue={user.role} className="input-field !w-auto !py-1.5 text-xs">
                              {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="btn-secondary !px-2 !py-1.5 text-xs">
                              Role
                            </button>
                          </form>
                        )}
                        {!statusLocked && (
                          <form action={setUserStatusAction} className="flex gap-1">
                            <input type="hidden" name="userId" value={user.id} />
                            <select
                              name="status"
                              defaultValue={user.account_status}
                              className="input-field !w-auto !py-1.5 text-xs"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                            <button type="submit" className="btn-secondary !px-2 !py-1.5 text-xs">
                              Status
                            </button>
                          </form>
                        )}
                        {statusLocked && !canManageRoles && isPrivileged && (
                          <span className="text-xs text-muted">Super admin only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No users found" description="Try adjusting the filters, or wait for new registrations." />
        </div>
      )}
    </>
  );
}
