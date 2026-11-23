"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveCategoryAction } from "@/app/admin/actions";
import type { ActionResult } from "@/types";
import type { CategoryRow } from "@/types/database.types";

export function CategoryForm({ category }: { category?: CategoryRow }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(saveCategoryAction, {
    ok: false,
    message: "",
  });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="grid gap-4">
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Name</span>
          <input name="name" required defaultValue={category?.name ?? ""} className="input-field" />
        </label>
        <label>
          <span className="field-label">Slug</span>
          <input name="slug" required pattern="[a-z0-9-]+" defaultValue={category?.slug ?? ""} className="input-field" />
        </label>
      </div>
      <label>
        <span className="field-label">Description</span>
        <textarea name="description" rows={3} defaultValue={category?.description ?? ""} className="input-field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Icon name</span>
          <input name="icon" placeholder="Home" defaultValue={category?.icon ?? ""} className="input-field" />
        </label>
        <label>
          <span className="field-label">Sort order</span>
          <input name="sort_order" type="number" min={0} defaultValue={category?.sort_order ?? 0} className="input-field" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-charcoal/75">
        <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="h-4 w-4 accent-[#123D32]" />
        Active
      </label>
      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-secondary  w-fit  disabled:opacity-60">
        <Save size={15} /> {pending ? "Saving..." : category ? "Update category" : "Add category"}
      </button>
    </form>
  );
}
