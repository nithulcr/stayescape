import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/guards";
import { storageBucket } from "@/lib/config";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { validateImageUpload } from "@/lib/uploads/validate-image";
import {
  canUploadAnotherImage,
  effectiveImageLimit,
  imageLimitMessage,
} from "@/lib/uploads/image-limit";
import {
  describeStorageError,
  logUploadDiagnostics,
  logUploadError,
  uploadFailureFrom,
} from "@/lib/uploads/upload-errors";

export async function POST(request: NextRequest) {
  try {
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
      .eq("owner_id", context.user.id)
      .maybeSingle();
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const plan = await getPlanContextForUser(context.user.id);
    const { data: databaseImageLimit } = await supabase.rpc("plan_limit_for", {
      p_owner_id: property.owner_id,
      p_limit_key: "max_images_per_property",
    });
    const imageLimit = effectiveImageLimit(plan.limits.maxImagesPerProperty, databaseImageLimit);
    const { count } = await supabase
      .from("property_images")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId);
    if (!plan.isUnlimited && !canUploadAnotherImage(count ?? 0, imageLimit)) {
      return NextResponse.json(
        {
          error: imageLimitMessage(plan.limits.planName, imageLimit),
        },
        { status: 403 },
      );
    }

    const admin = getAdminClient();
    const storage = (admin ?? supabase).storage.from(storageBucket);
    const path = `${context.user.id}/${propertyId}/${crypto.randomUUID()}.${image.extension}`;
    const logRlsDiagnostics = async () => {
      const [{ data: activeOwner }, { data: pathOwned }] = await Promise.all([
        supabase.rpc("is_active_property_owner", { p_user_id: context.user.id }),
        supabase.rpc("storage_property_path_is_owned", { p_path: path }),
      ]);
      logUploadDiagnostics("owner-rls", {
        bucket: storageBucket,
        usingAdminClient: Boolean(admin),
        profileRole: context.profile?.role ?? null,
        accountStatus: context.profile?.account_status ?? null,
        activeOwner,
        pathOwned,
        ownerId: property.owner_id,
        userId: context.user.id,
        propertyId,
        imageCount: count ?? 0,
        appImageLimit: plan.limits.maxImagesPerProperty,
        databaseImageLimit,
        effectiveImageLimit: imageLimit,
        path,
      });
    };

    let uploadError;
    try {
      const result = await storage.upload(path, image.bytes, {
        contentType: image.contentType,
        upsert: false,
      });
      uploadError = result.error;
    } catch (error) {
      await logRlsDiagnostics();
      logUploadError("owner-storage", error);
      return NextResponse.json(
        { error: describeStorageError(uploadFailureFrom(error)) },
        { status: 500 },
      );
    }
    if (uploadError) {
      await logRlsDiagnostics();
      logUploadError("owner-storage", uploadError);
      return NextResponse.json({ error: describeStorageError(uploadError) }, { status: 500 });
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
      logUploadError("owner-insert", insertError);
      await storage.remove([path]);
      return NextResponse.json(
        { error: "The image could not be saved. Please try again." },
        { status: 500 },
      );
    }

    revalidatePath("/dashboard/properties");
    revalidatePath("/properties");
    return NextResponse.json({ ok: true, image: inserted }, { status: 201 });
  } catch (error) {
    logUploadError("owner-request", error);
    return NextResponse.json(
      { error: describeStorageError(uploadFailureFrom(error)) },
      { status: 500 },
    );
  }
}
