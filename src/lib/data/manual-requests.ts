import "server-only";

import { manualPaymentProofBucket } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import type {
  ManualSubscriptionRequestRow,
  PlanRow,
  ProfileRow,
} from "@/types/database.types";

type SupabaseServer = NonNullable<Awaited<ReturnType<typeof getServerClient>>>;

type OwnerProfile = Pick<ProfileRow, "id" | "full_name" | "email">;

export type OwnerManualRequest = ManualSubscriptionRequestRow & {
  plan: PlanRow | null;
};

export type AdminManualRequest = ManualSubscriptionRequestRow & {
  owner: OwnerProfile | null;
  plan: PlanRow | null;
  verifiedBy: OwnerProfile | null;
  proofUrl: string | null;
};

async function fetchRequests(
  supabase: SupabaseServer,
  ownerId?: string,
): Promise<ManualSubscriptionRequestRow[]> {
  let query = supabase
    .from("manual_subscription_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (ownerId) query = query.eq("owner_id", ownerId);
  const { data } = await query;
  return (data ?? []) as ManualSubscriptionRequestRow[];
}

async function relatedData(supabase: SupabaseServer, requests: ManualSubscriptionRequestRow[]) {
  const planIds = [...new Set(requests.map((request) => request.plan_id))];
  const profileIds = [
    ...new Set(
      requests.flatMap((request) =>
        [request.owner_id, request.verified_by].filter((id): id is string => Boolean(id)),
      ),
    ),
  ];

  const [plansResult, profilesResult] = await Promise.all([
    planIds.length
      ? supabase.from("plans").select("*").in("id", planIds)
      : Promise.resolve({ data: [] as PlanRow[] }),
    profileIds.length
      ? supabase.from("profiles").select("id,full_name,email").in("id", profileIds)
      : Promise.resolve({ data: [] as OwnerProfile[] }),
  ]);

  return {
    plans: new Map(((plansResult.data ?? []) as PlanRow[]).map((plan) => [plan.id, plan])),
    profiles: new Map(
      ((profilesResult.data ?? []) as OwnerProfile[]).map((profile) => [profile.id, profile]),
    ),
  };
}

export async function getOwnerManualRequests(ownerId: string): Promise<OwnerManualRequest[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const requests = await fetchRequests(supabase, ownerId);
  if (!requests.length) return [];
  const { plans } = await relatedData(supabase, requests);

  return requests.map((request) => ({
    ...request,
    plan: plans.get(request.plan_id) ?? null,
  }));
}

export async function getAdminManualRequests(): Promise<AdminManualRequest[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const requests = await fetchRequests(supabase);
  if (!requests.length) return [];
  const { plans, profiles } = await relatedData(supabase, requests);
  const storage = (getAdminClient() ?? supabase).storage.from(manualPaymentProofBucket);

  return Promise.all(
    requests.map(async (request) => {
      let proofUrl: string | null = null;
      if (request.proof_path) {
        const { data } = await storage.createSignedUrl(request.proof_path, 60 * 10);
        proofUrl = data?.signedUrl ?? null;
      }
      return {
        ...request,
        owner: profiles.get(request.owner_id) ?? null,
        plan: plans.get(request.plan_id) ?? null,
        verifiedBy: request.verified_by ? profiles.get(request.verified_by) ?? null : null,
        proofUrl,
      };
    }),
  );
}
