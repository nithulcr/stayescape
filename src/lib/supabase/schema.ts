import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export async function hasPropertyPublicationColumn(supabase: Client): Promise<boolean> {
  const { error } = await supabase.from("properties").select("is_published").limit(1);
  if (!error) return true;

  return error.code !== "42703" && !error.message.includes("does not exist");
}
