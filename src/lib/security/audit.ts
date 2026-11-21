import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export async function recordAdminAudit(input: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  targetTable?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = getAdminClient();
  if (!admin) return;

  await admin.from("admin_audit_logs").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail ?? null,
    action: input.action,
    target_table: input.targetTable ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}
