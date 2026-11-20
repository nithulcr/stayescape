"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { savePropertyAdminAction } from "@/app/admin/actions";
import type { ActionResult } from "@/types";
import type { PropertyRow } from "@/types/database.types";

export function AdminPropertyForm({ property }: { property: PropertyRow }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(savePropertyAdminAction, {
    ok: false,
    message: "",
  });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="propertyId" value={property.id} />
      <label>
        <span className="field-label">Name</span>
        <input name="name" defaultValue={property.name} className="input-field" />
      </label>
      <label>
        <span className="field-label">Short description</span>
        <textarea name="short_description" rows={3} defaultValue={property.short_description ?? ""} className="input-field" />
      </label>
      <label>
        <span className="field-label">Full description</span>
        <textarea name="description" rows={6} defaultValue={property.description ?? ""} className="input-field" />
      </label>
      <label>
        <span className="field-label">Address</span>
        <input name="address" defaultValue={property.address ?? ""} className="input-field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Contact phone</span>
          <input name="contact_phone" defaultValue={property.contact_phone ?? ""} className="input-field" />
        </label>
        <label>
          <span className="field-label">WhatsApp</span>
          <input name="whatsapp_number" defaultValue={property.whatsapp_number ?? ""} className="input-field" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Status</span>
          <select name="status" defaultValue={property.status} className="input-field">
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-3 text-sm text-charcoal/75">
          <input type="checkbox" name="is_featured" defaultChecked={property.is_featured} className="h-4 w-4 accent-[#123D32]" />
          Featured
        </label>
      </div>
      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-fit disabled:opacity-60">
        <Save size={15} /> {pending ? "Saving..." : "Save property"}
      </button>
    </form>
  );
}
