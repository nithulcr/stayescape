import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext, isAdminRole } from "@/lib/auth/guards";
import { storageBucket } from "@/lib/config";
import { getPlanContextForUser } from "@/lib/plans/limits";
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

  const serverSupabase = await getServerClient();
  const admin = getAdminClient();
  const supabase = admin ?? serverSupabase;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const formData = await request.formData();
  const propertyId = formData.get("propertyId");
  const file = formData.get("file");
  if (typeof propertyId !== "string" || !(file instanceof File)) {
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

  const { data: property } = await supabase
    .from("properties")
    .select("id,owner_id")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const plan = await getPlanContextForUser(property.owner_id);
  const { count } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  if (!plan.isUnlimited && (count ?? 0) >= plan.limits.maxImagesPerProperty) {
    return NextResponse.json(
      {
        error: `The owner's ${plan.limits.planName} plan allows ${plan.limits.maxImagesPerProperty} image${plan.limits.maxImagesPerProperty === 1 ? "" : "s"} per property.`,
      },
      { status: 403 },
    );
  }

  const storage = supabase.storage.from(storageBucket);
  const path = `${property.owner_id}/${propertyId}/${crypto.randomUUID()}.${image.extension}`;

  const { error: uploadError } = await storage.upload(path, image.bytes, {
    contentType: image.contentType,
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
      alt_text: image.fileName,
      position: count ?? 0,
      is_cover: (count ?? 0) === 0,
    })
    .select("id,public_url,is_cover")
    .single();

  if (insertError) {
    await storage.remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  revalidatePath("/admin/properties");
  revalidatePath("/dashboard/properties");
  revalidatePath("/properties");
  return NextResponse.json({ ok: true, image: inserted }, { status: 201 });
}
