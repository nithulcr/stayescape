import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

async function hasPropertyColumn(supabase: Client, column: "is_published" | "has_requested_changes"): Promise<boolean> {
  const { error } = await supabase.from("properties").select(column).limit(1);
  if (!error) return true;

  return error.code !== "42703" && !error.message.includes("does not exist");
}

export async function hasPropertyPublicationColumn(supabase: Client): Promise<boolean> {
  return hasPropertyColumn(supabase, "is_published");
}

export async function hasPropertyChangeRequestColumn(supabase: Client): Promise<boolean> {
  return hasPropertyColumn(supabase, "has_requested_changes");
}
