import "server-only";

import { getServerClient } from "@/lib/supabase/server";
import type { OwnerEntitlement } from "@/types";

export async function getOwnerEntitlement(
  ownerId: string | null | undefined,
): Promise<OwnerEntitlement | null> {
  if (!ownerId) return null;

  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_owner_entitlement", { p_owner_id: ownerId });
  if (error || !data) return null;

  return data as unknown as OwnerEntitlement;
}
