"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  schemaFieldErrors,
} from "@/lib/validations";
import type { AuthResult } from "@/types";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function errorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { name: null as string | null, message: String(error), status: null, code: null, cause: null };
  }

  const value = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
    cause?: unknown;
  };
  const cause =
    typeof value.cause === "object" && value.cause !== null
      ? (value.cause as { name?: unknown; message?: unknown; code?: unknown })
      : null;

  return {
    name: typeof value.name === "string" ? value.name : null,
    message: typeof value.message === "string" ? value.message : String(value),
    status:
      typeof value.status === "number" || typeof value.status === "string"
        ? value.status
        : null,
    code: typeof value.code === "string" ? value.code : null,
    cause: cause
      ? {
          name: typeof cause.name === "string" ? cause.name : null,
          message: typeof cause.message === "string" ? cause.message : null,
          code: typeof cause.code === "string" ? cause.code : null,
        }
      : null,
  };
}

function isReachabilityError(details: ReturnType<typeof errorDetails>) {
  const message = details.message.toLowerCase();
  const causeCode = details.cause?.code?.toLowerCase() ?? "";
  return (
    message.includes("fetch failed") ||
    ["enotfound", "eai_again", "econnrefused", "etimedout", "cert_has_expired"].includes(
      causeCode,
    )
  );
}

function authErrorMessage(error: unknown, fallback: string) {
  const details = errorDetails(error);
  if (isReachabilityError(details)) {
    return "Unable to reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and restart the app.";
  }
  return details.message || fallback;
}

function logAuthError(action: string, error: unknown) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseHost: string | null = null;
  try {
    supabaseHost = rawUrl ? new URL(rawUrl).hostname : null;
  } catch {
    supabaseHost = "invalid";
  }

  console.error(`[auth] ${action} failed`, {
    supabaseHost,
    error: errorDetails(error),
  });
}

export async function registerAction(
  _previous: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Authentication is not configured yet. Add your Supabase environment variables and restart the app.",
    };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent("/auth/verify")}`,
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    logAuthError("registerAction", error);
    return {
      ok: false,
      message: authErrorMessage(
        error,
        "Could not create your account. Please try again.",
      ),
    };
  }

  return {
    ok: true,
    message:
      "Account created. Check your inbox to verify your email, then sign in to continue.",
  };
}

export async function loginAction(
  _previous: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return { ok: false, message: "Authentication is not configured yet." };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logAuthError("loginAction", error);
    return { ok: false, message: "Email or password is incorrect." };
  }

  const next = safeNext(formData.get("next"));
  if (next) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  revalidatePath("/", "layout");
  redirect(profile?.role === "admin" || profile?.role === "super_admin" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  const supabase = await getServerClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(
  _previous: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Authentication is not configured yet." };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
  });
  if (error) {
    logAuthError("forgotPasswordAction", error);
    return {
      ok: false,
      message: authErrorMessage(
        error,
        "Could not send password reset instructions. Please try again.",
      ),
    };
  }

  return { ok: true, message: "Password reset instructions have been sent to your email." };
}

export async function resetPasswordAction(
  _previous: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: schemaFieldErrors(parsed.error),
    };
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, message: "Authentication is not configured yet." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logAuthError("resetPasswordAction", error);
    return {
      ok: false,
      message: authErrorMessage(
        error,
        "Could not update your password. Please try again.",
      ),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  revalidatePath("/", "layout");
  redirect(profile?.role === "admin" || profile?.role === "super_admin" ? "/admin" : "/dashboard");
}
