import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext, isAdminRole } from "@/lib/auth/guards";
import { imageConstraints, storageBucket } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const context = await getAuthContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(context.profile?.role)) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const slug = formData.get("slug");

  if (!(file instanceof File) || typeof slug !== "string") {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (!imageConstraints.acceptedTypes.includes(file.type as (typeof imageConstraints.acceptedTypes)[number])) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 });
  }
  if (file.size > imageConstraints.maxBytes) {
    return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 400 });
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!cleanSlug) {
    return NextResponse.json({ error: "A destination slug is required." }, { status: 400 });
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `destinations/${cleanSlug}-${crypto.randomUUID()}.${extension}`;
  const admin = getAdminClient();
  const supabase = admin ?? (await getServerClient());
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const storage = supabase.storage.from(storageBucket);
  const { error: uploadError } = await storage.upload(path, new Uint8Array(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    const message = uploadError.message.toLowerCase().includes("permission denied")
      ? "You do not have permission to upload destination images."
      : uploadError.message;
    return NextResponse.json({ error: message || "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: storage.getPublicUrl(path).data.publicUrl });
}
