import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key missing" }, { status: 503 });

  const { error } = await admin
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/dashboard");
  revalidatePath("/admin/subscriptions");
  return NextResponse.json({ ok: true });
}
