"use client";

import { useActionState } from "react";
import {
  selectPublishedPropertyAction,
  setPropertyPublicationAction,
} from "@/app/dashboard/properties/actions";
import type { ActionResult } from "@/types";

type SelectableProperty = {
  id: string;
  name: string;
  isPublished: boolean;
  publishAfterRenewal: boolean;
};

const initialState: ActionResult = { ok: true, message: "" };

function PublishToggle({ property }: { property: SelectableProperty }) {
  const [state, formAction, pending] = useActionState(
    setPropertyPublicationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="propertyId" value={property.id} />
      <input type="hidden" name="publish" value={property.isPublished ? "false" : "true"} />
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
}: {
  properties: SelectableProperty[];
  needsSelection: boolean;
}) {
  const [state, formAction, pending] = useActionState(selectPublishedPropertyAction, initialState);
  const approved = properties.filter((property) =>
    needsSelection ? true : property.publishAfterRenewal,
  );

  return (
    <>
      {needsSelection ? (
        <section className="surface-card mt-6 border-l-4 border-amber-400 p-6">
          <h2 className="font-serif text-xl text-forest-deep">Choose one property to keep published</h2>
          <p className="mt-2 text-sm text-muted">
            Your Premium plan has expired. Your listings are safe, but only one can remain published
            until you upgrade again.
          </p>
          <form action={formAction} className="mt-4 grid gap-3">
            {approved.map((property) => (
              <label
                key={property.id}
                className="flex items-center gap-3 rounded-lg border border-forest/10 px-4 py-3 text-sm"
              >
                <input type="radio" name="propertyId" value={property.id} required />
                <span className="font-medium text-forest-deep">{property.name}</span>
              </label>
            ))}
            <button type="submit" disabled={pending} className="btn-primary w-fit disabled:opacity-50">
              {pending ? "Saving…" : "Keep this property published"}
            </button>
            {state.message ? (
              <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-700"}>
                {state.message}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}

      {properties.length ? (
        <div className="mt-4 grid gap-3">
          {properties.map((property) => (
            <div key={property.id} className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-charcoal/80">
                {property.name}
                {property.publishAfterRenewal ? (
                  <span className="ml-2 text-xs text-gold">Restores when Premium renews</span>
                ) : null}
              </p>
              <PublishToggle property={property} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
