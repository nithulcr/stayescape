"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { saveDestinationAction } from "@/app/admin/actions";
import type { ActionResult } from "@/types";
import type { DestinationRow } from "@/types/database.types";

export function DestinationForm({ destination }: { destination?: DestinationRow }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(destination?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(saveDestinationAction, {
    ok: false,
    message: "",
  });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("slug", destination?.slug ?? "new-destination");
    try {
      const response = await fetch("/api/admin/destination-image", { method: "POST", body: formData });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Upload failed.");
      setImageUrl(result.url);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <form action={formAction} className="grid gap-4">
      {destination && <input type="hidden" name="destinationId" value={destination.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Name</span>
          <input name="name" required defaultValue={destination?.name ?? ""} className="input-field" />
          {state.fieldErrors?.name && <span className="field-error">{state.fieldErrors.name[0]}</span>}
        </label>
        <label>
          <span className="field-label">Slug</span>
          <input name="slug" required pattern="[a-z0-9-]+" defaultValue={destination?.slug ?? ""} className="input-field" />
          {state.fieldErrors?.slug && <span className="field-error">{state.fieldErrors.slug[0]}</span>}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">State</span>
          <input name="state" required defaultValue={destination?.state ?? "Kerala"} className="input-field" />
        </label>
        <label>
          <span className="field-label">Sort order</span>
          <input name="sort_order" type="number" min={0} defaultValue={destination?.sort_order ?? 0} className="input-field" />
        </label>
      </div>
      <label>
        <span className="field-label">Short description</span>
        <textarea name="short_description" rows={3} defaultValue={destination?.short_description ?? ""} className="input-field" />
      </label>
      <label>
        <span className="field-label">Description</span>
        <textarea name="description" rows={5} defaultValue={destination?.description ?? ""} className="input-field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">SEO title</span>
          <input name="seo_title" defaultValue={destination?.seo_title ?? ""} className="input-field" />
        </label>
        <label>
          <span className="field-label">SEO description</span>
          <input name="seo_description" defaultValue={destination?.seo_description ?? ""} className="input-field" />
        </label>
      </div>

      <div>
        <span className="field-label">Cover image</span>
        <div className="flex flex-wrap items-center gap-4">
          {imageUrl ? (
            <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-sand">
              <Image src={imageUrl} alt="Destination cover" fill sizes="144px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-24 w-36 items-center justify-center rounded-lg bg-sand text-xs text-muted">No image</div>
          )}
          <label className="btn-secondary cursor-pointer !py-2">
            <ImagePlus size={14} /> {uploading ? "Uploading..." : "Upload image"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
        </div>
        {uploading && <Loader2 size={14} className="mt-2 animate-spin text-muted" />}
        {uploadError && <p className="mt-2 text-xs text-rose-600">{uploadError}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-charcoal/75">
        <input type="checkbox" name="is_active" defaultChecked={destination?.is_active ?? true} className="h-4 w-4 accent-[#123D32]" />
        Active
      </label>

      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-secondary  w-fit  disabled:opacity-60">
        <Save size={15} /> {pending ? "Saving..." : destination ? "Update destination" : "Add destination"}
      </button>
    </form>
  );
}
