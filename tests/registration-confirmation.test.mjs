import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const actions = await source("../src/app/auth/actions.ts");
const form = await source("../src/components/auth/auth-form.tsx");
const types = await source("../src/types/index.ts");
const packageJson = JSON.parse(await source("../package.json"));

test("register action returns email confirmation state for the UI", () => {
  assert.ok(actions.includes("const { data, error } = await supabase.auth.signUp"));
  assert.ok(
    actions.includes("const confirmationRequired = !data.session && !data.user?.confirmed_at;"),
  );
  assert.ok(actions.includes("email: parsed.data.email,"));
  assert.ok(actions.includes("Supabase confirmation email"));
});

test("registration success renders a check-email confirmation screen with resend", () => {
  assert.ok(form.includes("function RegistrationConfirmation"));
  assert.ok(form.includes("Check your email"));
  assert.ok(form.includes("Supabase confirmation email"));
  assert.ok(form.includes("Resend confirmation email"));
  assert.ok(form.includes("confirmationRequired={state.confirmationRequired}"));
  assert.ok(form.includes('aria-live="polite"'));
});

test("resend action uses Signup OTP with safe redirect and rate limit", () => {
  assert.ok(actions.includes("export async function resendRegistrationConfirmationAction"));
  assert.ok(actions.includes("supabase.auth.resend"));
  assert.ok(actions.includes('type: "signup"'));
  assert.ok(
    actions.includes(
      'emailRedirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent("/auth/verify")}`',
    ),
  );
  assert.ok(actions.includes('enforceRateLimit("register", `${email}|resend-confirmation`)'));
  assert.ok(actions.includes("Confirmation email sent again."));
});

test("auth result carries confirmation state and the test is registered", () => {
  assert.ok(types.includes("email?: string;"));
  assert.ok(types.includes("confirmationRequired?: boolean;"));
  assert.ok(packageJson.scripts.test.includes("tests/registration-confirmation.test.mjs"));
});
