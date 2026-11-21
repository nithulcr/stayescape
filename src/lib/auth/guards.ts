import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database.types";

export type AuthContext = {
  user: User;
  profile: ProfileRow | null;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (data as ProfileRow | null) ?? null };
}

export async function requireUser(nextPath = "/dashboard") {
  const context = await getAuthContext();
  if (!context) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (context.profile?.account_status === "suspended") redirect("/account-suspended");
  return context;
}

export function isAdminRole(role: string | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined) {
  return role === "super_admin";
}

export async function requireOwner(nextPath = "/dashboard") {
  const context = await requireUser(nextPath);
  if (!["owner", "admin", "super_admin"].includes(context.profile?.role ?? "")) {
    redirect("/dashboard");
  }
  return context;
}

export async function requireAdmin() {
  const context = await requireUser("/admin");
  if (!isAdminRole(context.profile?.role)) redirect("/dashboard");
  return context;
}

export async function requireSuperAdmin() {
  const context = await requireUser("/admin");
  if (!isSuperAdminRole(context.profile?.role)) redirect("/admin");
  return context;
}
