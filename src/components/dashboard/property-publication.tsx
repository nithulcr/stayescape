"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import {
  selectPublishedPropertyAction,
  setPropertyPublicationAction,
} from "@/app/dashboard/properties/actions";
import { StatusPill } from "@/components/ui/status-pill";
import type { ActionResult } from "@/types";

type PublicationProperty = {
  id: string;
  name: string;
  coverImage: string;
  location: string;
  status: string;
  isPublished: boolean;
  publishAfterRenewal: boolean;
  canSelect: boolean;
};

const initialState: ActionResult = { ok: true, message: "" };

function PublishToggle({ property }: { property: PublicationProperty }) {
  const [state, formAction, pending] = useActionState(
    setPropertyPublicationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="propertyId" value={property.id} />
      <input
        type="hidden"
        name="publish"
        value={property.isPublished ? "false" : "true"}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-lg border border-forest/15 px-3 py-2 text-xs font-semibold text-forest-deep hover:bg-forest/5 disabled:opacity-50"
      >
        {property.isPublished ? "Unpublish" : "Publish"}
      </button>
      {state.message ? (
        <span className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-700"}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function PropertyPublicationControls({
  properties,
  needsSelection,
  showPublishControls = true,
}: {
  properties: PublicationProperty[];
  needsSelection: boolean;
  showPublishControls?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    selectPublishedPropertyAction,
    initialState,
  );
  const [selectedId, setSelectedId] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      {needsSelection ? (
        <section className="surface-card mt-6 border-l-4 border-amber-400 p-6">
          <h2 className="font-serif text-xl text-forest-deep">Choose your Free property</h2>
          <p className="mt-2 text-sm text-muted">
            Select the one property to keep on your Free plan. All properties stay saved; the others
            will be unpublished until Premium is active again.
          </p>
          {properties.length ? (
            <form action={formAction} className="mt-5 grid gap-3">
              {properties.map((property) => (
                <label
                  key={property.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-sm transition ${
                    property.canSelect
                      ? "cursor-pointer border-forest/10 hover:border-forest/30"
                      : "cursor-not-allowed border-stone-200 opacity-70"
                  } ${selectedId === property.id ? "border-forest bg-forest/5" : ""}`}
                >
                  <input
                    className="mt-8"
                    type="radio"
                    name="propertyId"
                    value={property.id}
                    checked={selectedId === property.id}
                    disabled={!property.canSelect || pending}
                    onChange={() => setSelectedId(property.id)}
                    required
                  />
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                    <Image
                      src={property.coverImage}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-forest-deep">{property.name}</span>
                      <StatusPill status={property.status} />
                      <StatusPill status={property.isPublished ? "published" : "unpublished"}>
                        {property.isPublished ? "Currently published" : "Currently unpublished"}
                      </StatusPill>
                      {property.publishAfterRenewal ? (
                        <StatusPill status="premium">Restores on renewal</StatusPill>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{property.location}</span>
                    {!property.canSelect ? (
                      <span className="mt-1 block text-xs text-rose-700">
                        This can be your Free property, but it must be approved before it can be public.
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <input
                  className="mt-0.5"
                  type="checkbox"
                  name="confirmSelection"
                  value="true"
                  checked={confirmed}
                  disabled={pending}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  required
                />
                <span>
                  I understand that my other properties will stay saved but unpublished, and that
                  Premium features and eligible listings return when Premium is active again.
                </span>
              </label>
              <button
                type="submit"
                disabled={pending || !selectedId || !confirmed}
                className="btn-primary w-fit disabled:opacity-50"
              >
                {pending ? "Saving…" : "Confirm Free property"}
              </button>
              {state.message ? (
                <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-700"}>
                  {state.message}
                </p>
              ) : null}
            </form>
          ) : (
            <p className="mt-4 text-sm text-rose-700">
              No property is available to select.
            </p>
          )}
        </section>
      ) : null}

      {!needsSelection && showPublishControls && properties.length ? (
        <div className="mt-4 grid gap-3">
          {properties
            .filter((property) => property.canSelect)
            .map((property) => (
              <div
                key={property.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-forest/8 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-forest-deep">
                    {property.name}
                    {property.publishAfterRenewal ? (
                      <span className="ml-2 text-xs text-gold">Restores when Premium renews</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{property.location}</p>
                </div>
                <PublishToggle property={property} />
              </div>
            ))}
        </div>
      ) : null}
    </>
  );
}
