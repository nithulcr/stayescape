import Image from "next/image";
import Link from "next/link";
import {
  changePropertyOwnerAdminAction,
  deletePropertyAdminAction,
  setPropertyStatusAction,
  toggleFeaturedAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { isSuperAdminRole, requireAdmin } from "@/lib/auth/guards";
import { getAllProperties, getPropertyOwnerCandidates } from "@/lib/data/admin";
import { fallbackPropertyImage } from "@/lib/media";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
];

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const { profile } = await requireAdmin();
  const canChangeOwner = isSuperAdminRole(profile?.role);
  const [properties, owners] = await Promise.all([
    getAllProperties({ status, q }),
    canChangeOwner ? getPropertyOwnerCandidates() : Promise.resolve([]),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1 className="display-title mt-3 text-4xl">Properties.</h1>
          <p className="mt-3 text-sm text-muted">
            Create listings, approve submissions, manage featured placement and review owner details.
          </p>
        </div>
        <Link href="/admin/properties/new" className="btn-primary">Add property</Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Search
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Property name"
            className="input-field !w-56"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Status
          <select name="status" defaultValue={status ?? ""} className="input-field !w-40">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
        <Link href="/admin/properties" className="text-xs text-muted hover:text-forest">
          Reset
        </Link>
      </form>

      {properties.length ? (
        <div className="mt-6 grid gap-4">
          {properties.map((property) => (
            <article key={property.id} className="surface-card p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-sand lg:w-40">
                  <Image
                    src={property.cover_image || fallbackPropertyImage}
                    alt={property.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-xl text-forest-deep">{property.name}</h2>
                    <StatusPill status={property.status} />
                    {property.is_featured && <StatusPill status="premium">Featured</StatusPill>}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {property.destination_name} · {property.category_name} · by {property.owner_name}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
                    {property.short_description ?? "No short description."}
                  </p>
                  {property.rejection_reason && (
                    <p className="mt-2 text-xs text-rose-600">Reason: {property.rejection_reason}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 lg:w-64">
                  <Link href={`/admin/properties/${property.id}`} className="btn-secondary !py-2">
                    Edit details
                  </Link>
                  <Link href={`/properties/${property.slug}`} target="_blank" className="btn-secondary !py-2">
                    View property
                  </Link>
                  {canChangeOwner && (
                    <form action={changePropertyOwnerAdminAction} className="grid gap-2">
                      <input type="hidden" name="propertyId" value={property.id} />
                      <label className="text-[0.65rem] uppercase tracking-wider text-muted">
                        Change owner
                        <select
                          name="ownerId"
                          defaultValue={property.owner_id}
                          className="input-field !py-2 text-xs normal-case tracking-normal"
                        >
                          {owners.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                              {owner.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <ConfirmSubmitButton
                        message={`Change the owner of "${property.name}"?`}
                        className="btn-secondary !py-2"
                      >
                        Change owner
                      </ConfirmSubmitButton>
                    </form>
                  )}
                  <form action={toggleFeaturedAction} className="grid gap-2">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="featured" value={String(property.is_featured)} />
                    <button type="submit" className="btn-secondary !py-2">
                      {property.is_featured ? "Remove featured" : "Make featured"}
                    </button>
                  </form>
                  {property.status !== "approved" && (
                    <div className="grid gap-2">
                      <form action={setPropertyStatusAction}>
                        <input type="hidden" name="propertyId" value={property.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button type="submit" className="btn-primary w-full !px-2 !py-2 text-xs">
                          Approve
                        </button>
                      </form>
                      <form action={setPropertyStatusAction} className="grid gap-2">
                        <input type="hidden" name="propertyId" value={property.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input
                          name="reason"
                          required
                          placeholder="Rejection reason (required)"
                          className="input-field !py-2 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                  <form action={deletePropertyAdminAction}>
                    <input type="hidden" name="propertyId" value={property.id} />
                    <ConfirmSubmitButton
                      message={`Delete "${property.name}"? This cannot be undone.`}
                      className="text-xs text-rose-600 hover:text-rose-700"
                    >
                      Delete property
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No properties found" description="Owner submissions will appear here for review." />
        </div>
      )}
    </>
  );
}
