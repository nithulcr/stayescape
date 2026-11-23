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
import { districtOptions } from "@/lib/config";
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
  searchParams: Promise<{ status?: string; q?: string; district?: string; view?: string }>;
}) {
  const { status, q, district, view } = await searchParams;
  const activeView = view === "requests" ? "requests" : "active";
  const { profile } = await requireAdmin();
  const canChangeOwner = isSuperAdminRole(profile?.role);
  const [properties, owners] = await Promise.all([
    getAllProperties({
      status,
      q,
      district,
      changeRequestsOnly: activeView === "requests",
    }),
    canChangeOwner ? getPropertyOwnerCandidates() : Promise.resolve([]),
  ]);

  const viewHref = (nextView: "active" | "requests") => {
    const params = new URLSearchParams();
    params.set("view", nextView);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (district) params.set("district", district);
    return `/admin/properties?${params.toString()}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1 className="display-title mt-3 text-4xl">Properties.</h1>
          <p className="mt-3 text-sm text-muted">
            Create listings, approve submissions, manage featured placement and
            review owner details.
          </p>
        </div>
        <Link href="/admin/properties/new" className="btn-primary">
          Add property
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b border-forest/10">
        <Link
          href={viewHref("active")}
          className={`border-b-2 px-4 py-2 text-sm font-semibold ${
            activeView === "active"
              ? "border-forest text-forest"
              : "border-transparent text-muted hover:text-forest"
          }`}
        >
          Active
        </Link>
        <Link
          href={viewHref("requests")}
          className={`border-b-2 px-4 py-2 text-sm font-semibold ${
            activeView === "requests"
              ? "border-forest text-forest"
              : "border-transparent text-muted hover:text-forest"
          }`}
        >
          Requested changes
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <input type="hidden" name="view" value={activeView} />
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
          <select
            name="status"
            defaultValue={status ?? ""}
            className="input-field !w-40"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          District
          <select
            name="district"
            defaultValue={district ?? ""}
            className="input-field !w-44"
          >
            <option value="">All districts</option>
            {districtOptions.map((item) => (
              <option key={item.slug} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
        <Link
          href={`/admin/properties?view=${activeView}`}
          className="text-xs text-muted hover:text-forest"
        >
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
                    <h2 className="font-serif text-xl text-forest-deep">
                      {property.name}
                    </h2>
                    <StatusPill status={property.status} />
                    {property.is_featured && (
                      <StatusPill status="premium">Featured</StatusPill>
                    )}
                    {property.has_requested_changes && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Requested changes
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {property.district
                      ? `${property.district}, ${property.state}`
                      : property.state}{" "}
                    · {property.destination_name} · {property.category_name} ·
                    by {property.owner_name}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
                    {property.short_description ?? "No short description."}
                  </p>
                  {property.rejection_reason && (
                    <p className="mt-2 text-xs text-rose-600">
                      Reason: {property.rejection_reason}
                    </p>
                  )}
                  <div className="flex  gap-2 items-end mt-4 flex-wrap">
                    {canChangeOwner && (
                      <form
                        action={changePropertyOwnerAdminAction}
                        className="flex items-end gap-2 "
                      >
                        <input
                          type="hidden"
                          name="propertyId"
                          value={property.id}
                        />
                        <label className="text-[0.65rem] uppercase tracking-wider text-muted w-[240px]">
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
                          className="btn-primary !py-2"
                        >
                          Change owner
                        </ConfirmSubmitButton>
                      </form>
                    )}
                    <form action={toggleFeaturedAction} className="flex items-end gap-2">
                      <input
                        type="hidden"
                        name="propertyId"
                        value={property.id}
                      />
                      <input
                        type="hidden"
                        name="featured"
                        value={String(property.is_featured)}
                      />
                      <button type="submit" className="btn-secondary !py-2">
                        {property.is_featured
                          ? "Remove featured"
                          : "Make featured"}
                      </button>
                    </form>
                    {property.status !== "approved" && (
                      <div className="flex items-end gap-2">
                        <form action={setPropertyStatusAction}>
                          <input
                            type="hidden"
                            name="propertyId"
                            value={property.id}
                          />
                          <input type="hidden" name="status" value="approved" />
                          <button
                            type="submit"
                            className="btn-primary w-full !px-2 !py-2 text-xs"
                          >
                            Approve
                          </button>
                        </form>
                        <form
                          action={setPropertyStatusAction}
                          className="flex items-end gap-2"
                        >
                          <input
                            type="hidden"
                            name="propertyId"
                            value={property.id}
                          />
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
                   
                  </div>
                </div>
                <div className="flex flex-col gap-2 lg:w-64">
                  <Link
                    href={`/admin/properties/${property.id}`}
                    className="btn-primary !py-2"
                  >
                    Edit details
                  </Link>
                  <Link
                    href={`/properties/${property.slug}`}
                    target="_blank"
                    className="btn-primary !py-2"
                  >
                    View property
                  </Link>
                   <form className="btn-primary !py-2" action={deletePropertyAdminAction}>
                      <input
                        type="hidden"
                        name="propertyId"
                        value={property.id}
                      />
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
          <EmptyState
            title={activeView === "requests" ? "No requested changes" : "No properties found"}
            description={
              activeView === "requests"
                ? "Owner edits to approved properties will appear here for review."
                : "Owner submissions will appear here for review."
            }
          />
        </div>
      )}
    </>
  );
}
