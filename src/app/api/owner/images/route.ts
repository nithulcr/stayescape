import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/guards";
import { storageBucket, imageConstraints } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { getPlanContextForUser } from "@/lib/plans/limits";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  const context = await getAuthContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (context.profile?.account_status === "suspended") {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const formData = await request.formData();
  const propertyId = formData.get("propertyId");
  const file = formData.get("file");

  if (typeof propertyId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  if (!imageConstraints.acceptedTypes.includes(file.type as (typeof imageConstraints.acceptedTypes)[number])) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 });
  }
  if (file.size > imageConstraints.maxBytes) {
    return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 400 });
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id,owner_id")
    .eq("id", propertyId)
    .eq("owner_id", context.user.id)
    .maybeSingle();
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const plan = await getPlanContextForUser(context.user.id);
  const { count } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  if ((count ?? 0) >= plan.limits.maxImagesPerProperty) {
    return NextResponse.json(
      {
        error: `Your ${plan.limits.planName} plan allows ${plan.limits.maxImagesPerProperty} image${plan.limits.maxImagesPerProperty === 1 ? "" : "s"} per property.`,
      },
      { status: 403 },
    );
  }

  const admin = getAdminClient();
  const storage = (admin ?? supabase).storage.from(storageBucket);
  const extension = extensions[file.type] ?? "jpg";
  const path = `${context.user.id}/${propertyId}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await storage.upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const publicUrl = storage.getPublicUrl(path).data.publicUrl;
  const { data: inserted, error: insertError } = await supabase
    .from("property_images")
    .insert({
      property_id: propertyId,
      storage_path: path,
      public_url: publicUrl,
      alt_text: file.name.slice(0, 150),
      position: count ?? 0,
      is_cover: (count ?? 0) === 0,
    })
    .select("id,public_url,is_cover")
    .single();

  if (insertError) {
    await storage.remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  revalidatePath("/dashboard/properties");
  revalidatePath("/properties");
  return NextResponse.json({ ok: true, image: inserted }, { status: 201 });
}
