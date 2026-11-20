import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { guestReviewCookie, guestReviewHeader, isValidGuestReviewId } from "@/lib/reviews/guest";
import type { Database } from "@/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isServerSupabaseConfigured = Boolean(url && anonKey);

export async function getServerClient(): Promise<SupabaseClient<Database> | null> {
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(guestReviewCookie)?.value;

  return createServerClient<Database>(url, anonKey, {
    ...(isValidGuestReviewId(guestToken)
      ? { global: { headers: { [guestReviewHeader]: guestToken } } }
      : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          return;
        }
      },
    },
  });
}
