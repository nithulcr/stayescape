import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const headerSecret = request.headers.get("x-cron-secret");
  const received = Buffer.from(
    headerSecret ? `Bearer ${headerSecret}` : (request.headers.get("authorization") ?? ""),
  );
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function processExpiries(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service role key missing" }, { status: 503 });

  const { data, error } = await admin.rpc("apply_expired_property_policy", {});
  if (error) return NextResponse.json({ error: "Expiry processing failed" }, { status: 500 });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/properties");
  return NextResponse.json({ ok: true, result: data ?? {} });
}

export async function GET(request: NextRequest) {
  return processExpiries(request);
}

export async function POST(request: NextRequest) {
  return processExpiries(request);
}
