"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from "@/app/auth/actions";
import type { AuthResult } from "@/types";

type Mode = "login" | "register" | "forgot" | "reset";

const actions = {
  login: loginAction,
  register: registerAction,
  forgot: forgotPasswordAction,
  reset: resetPasswordAction,
};

const copy: Record<Mode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to STAYESCAPE",
    description: "Manage your stays, enquiries and subscription in one place.",
    submit: "Sign in",
  },
  register: {
    eyebrow: "Create an account",
    title: "Join STAYESCAPE",
    description: "Discover distinctive stays or start listing your own property.",
    submit: "Create account",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Reset your password",
    description: "We will send secure reset instructions to your email address.",
    submit: "Send instructions",
  },
  reset: {
    eyebrow: "Almost there",
    title: "Choose a new password",
    description: "Use at least eight characters for your new password.",
    submit: "Update password",
  },
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <span className="field-error">{errors[0]}</span>;
}

export function AuthForm({
  mode,
  next,
  role = "owner",
}: {
  mode: Mode;
  next?: string;
  role?: "user" | "owner";
}) {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(actions[mode], {
    ok: false,
    message: "",
  });
  const text = copy[mode];

  if (state.ok && mode !== "login") {
    return (
      <div className="surface-card p-8">
        <h1 className="font-serif text-2xl text-forest-deep">Check your inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{state.message}</p>
        <Link href="/login" className="btn-primary mt-6 w-full justify-center">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1 className="mt-3 font-serif text-3xl text-forest-deep">{text.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text.description}</p>

      <form action={formAction} className="mt-8 grid gap-4">
        {next && mode === "login" && <input type="hidden" name="next" value={next} />}

        {mode === "register" && (
          <>
            <label>
              <span className="field-label">Full name</span>
              <input name="fullName" required minLength={2} autoComplete="name" className="input-field" />
              <FieldError errors={state.fieldErrors?.fullName} />
            </label>
            <label>
              <span className="field-label">I am here to</span>
              <select name="role" defaultValue={role} className="input-field">
                <option value="owner">List my property</option>
                <option value="user">Discover and book stays</option>
              </select>
            </label>
          </>
        )}

        {(mode === "login" || mode === "register" || mode === "forgot") && (
          <label>
            <span className="field-label">Email address</span>
            <input name="email" type="email" required autoComplete="email" className="input-field" />
            <FieldError errors={state.fieldErrors?.email} />
          </label>
        )}

        {(mode === "login" || mode === "register") && (
          <label>
            <span className="field-label">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : 1}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="input-field"
            />
            <FieldError errors={state.fieldErrors?.password} />
          </label>
        )}

        {(mode === "register" || mode === "reset") && (
          <label>
            <span className="field-label">Confirm password</span>
            <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="input-field" />
            <FieldError errors={state.fieldErrors?.confirmPassword} />
          </label>
        )}

        {state.message && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.message}</p>
        )}

        <button type="submit" disabled={pending} className="btn-primary mt-2 w-full justify-center disabled:opacity-60">
          {pending ? "Please wait..." : text.submit}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted">
        {mode === "login" && (
          <>
            <Link href="/forgot-password" className="hover:text-forest">Forgot your password?</Link>
            <p>
              New here? <Link href="/register" className="font-semibold text-forest">Create an account</Link>
            </p>
          </>
        )}
        {mode === "register" && (
          <p>
            Already have an account? <Link href="/login" className="font-semibold text-forest">Sign in</Link>
          </p>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <Link href="/login" className="hover:text-forest">Back to sign in</Link>
        )}
      </div>
    </div>
  );
}
