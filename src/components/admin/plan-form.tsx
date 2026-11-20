"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { savePlanAction } from "@/app/admin/actions";
import type { ActionResult } from "@/types";
import type { PlanRow } from "@/types/database.types";

export function PlanForm({ plan }: { plan: PlanRow }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(savePlanAction, {
    ok: false,
    message: "",
  });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="planId" value={plan.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Monthly price (₹)</span>
          <input name="price_monthly" type="number" min={0} defaultValue={plan.price_monthly} className="input-field" />
        </label>
        <label>
          <span className="field-label">Yearly price (₹)</span>
          <input name="price_yearly" type="number" min={0} defaultValue={plan.price_yearly} className="input-field" />
        </label>
        <label>
          <span className="field-label">Max properties</span>
          <input name="max_properties" type="number" min={1} defaultValue={plan.max_properties} className="input-field" />
        </label>
        <label>
          <span className="field-label">Max images per property</span>
          <input name="max_images_per_property" type="number" min={1} defaultValue={plan.max_images_per_property} className="input-field" />
        </label>
      </div>
      <label>
        <span className="field-label">Expired listing visibility</span>
        <select name="expired_listing_visibility" defaultValue={plan.expired_listing_visibility} className="input-field">
          <option value="keep_visible">Keep visible</option>
          <option value="hide">Hide</option>
        </select>
      </label>
      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-fit disabled:opacity-60">
        <Save size={15} /> {pending ? "Saving..." : "Save plan"}
      </button>
    </form>
  );
}
