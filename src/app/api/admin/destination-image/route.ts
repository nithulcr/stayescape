import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext, isAdminRole } from "@/lib/auth/guards";
import { storageBucket } from "@/lib/config";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { validateImageUpload } from "@/lib/uploads/validate-image";

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
  if (!(await enforceRateLimit("upload", context.user.id))) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  const validation = await validateImageUpload(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const image = validation.image;

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!cleanSlug) {
    return NextResponse.json({ error: "A destination slug is required." }, { status: 400 });
  }

  const path = `destinations/${cleanSlug}-${crypto.randomUUID()}.${image.extension}`;
  const admin = getAdminClient();
  const supabase = admin ?? (await getServerClient());
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const storage = supabase.storage.from(storageBucket);
  const { error: uploadError } = await storage.upload(path, image.bytes, {
    contentType: image.contentType,
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
