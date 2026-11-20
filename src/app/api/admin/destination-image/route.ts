import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { imageConstraints, storageBucket } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  await requireAdmin();
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

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `destinations/${slug.replace(/[^a-z0-9-]/g, "")}-${crypto.randomUUID()}.${extension}`;
  const admin = getAdminClient();
  const supabase = admin ?? (await getServerClient());
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const storage = supabase.storage.from(storageBucket);
  const { error } = await storage.upload(path, new Uint8Array(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

  return NextResponse.json({ ok: true, url: storage.getPublicUrl(path).data.publicUrl });
}
