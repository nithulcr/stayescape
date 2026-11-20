"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { deleteImageAction, setCoverImageAction } from "@/app/dashboard/properties/actions";
import {
  deleteImageAdminAction,
  setCoverImageAdminAction,
} from "@/app/admin/actions";
import type { PropertyImageRow } from "@/types/database.types";

export function ImageUploader({
  propertyId,
  images,
  maxImages,
  adminMode = false,
  unlimited = false,
}: {
  propertyId: string;
  images: PropertyImageRow[];
  maxImages: number;
  adminMode?: boolean;
  unlimited?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.set("propertyId", propertyId);
        formData.set("file", file);
        const response = await fetch(
          adminMode ? "/api/admin/property-images" : "/api/owner/images",
          { method: "POST", body: formData },
        );
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(result.error ?? "Upload failed.");
          break;
        }
      }
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-forest-deep">Photos</h2>
          <p className="mt-1 text-xs text-muted">
            {unlimited
              ? `${images.length} images uploaded. No plan limit.`
              : `${images.length} of ${maxImages} images used.`} JPG, PNG, WebP or AVIF up to 5 MB.
          </p>
        </div>
        <label className="btn-secondary cursor-pointer !py-2">
          <ImagePlus size={15} /> Add photos
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            disabled={uploading || (!unlimited && images.length >= maxImages)}
            onChange={(event) => void upload(event.target.files)}
          />
        </label>
      </div>

      {uploading && (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted">
          <Loader2 size={14} className="animate-spin" /> Uploading...
        </p>
      )}
      {error && <p className="mt-4 text-xs text-rose-600">{error}</p>}

      {images.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-lg border border-forest/10">
              <div className="relative aspect-[4/3] bg-sand">
                <Image src={image.public_url} alt={image.alt_text ?? ""} fill sizes="300px" className="object-cover" />
                {image.is_cover && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-forest/90 px-2 py-1 text-[0.62rem] text-ivory">
                    <Star size={10} fill="currentColor" /> Cover
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                {!image.is_cover ? (
                  <form action={adminMode ? setCoverImageAdminAction : setCoverImageAction}>
                    <input type="hidden" name="propertyId" value={propertyId} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <button type="submit" className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
                      <Star size={13} /> Set cover
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-muted">Cover image</span>
                )}
                <form action={adminMode ? deleteImageAdminAction : deleteImageAction}>
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <button type="submit" className="inline-flex items-center gap-1 text-xs text-rose-600">
                    <Trash2 size={13} /> Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-sand/60 px-4 py-6 text-center text-sm text-muted">
          No photos yet. Add at least one so travellers can see your property.
        </p>
      )}
    </section>
  );
}
