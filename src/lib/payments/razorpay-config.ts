export type RazorpayKeyValidation =
  | { ok: true; keyId: string; keySecret: string }
  | {
      ok: false;
      reason:
        | "missing_key_id"
        | "missing_key_secret"
        | "invalid_key_id"
        | "test_key_in_production";
    };

const LIVE_KEY_ID = /^rzp_live_[A-Za-z0-9]+$/;
const TEST_KEY_ID = /^rzp_test_[A-Za-z0-9]+$/;

export function validateRazorpayKeyPair(input: {
  keyId?: string | null;
  keySecret?: string | null;
  isProduction?: boolean;
}): RazorpayKeyValidation {
  const keyId = input.keyId?.trim() ?? "";
  const keySecret = input.keySecret?.trim() ?? "";

  if (!keyId) return { ok: false, reason: "missing_key_id" };
  if (!keySecret) return { ok: false, reason: "missing_key_secret" };

  if (input.isProduction) {
    if (TEST_KEY_ID.test(keyId) || !LIVE_KEY_ID.test(keyId)) {
      return {
        ok: false,
        reason: keyId.startsWith("rzp_test_") ? "test_key_in_production" : "invalid_key_id",
      };
    }
    return { ok: true, keyId, keySecret };
  }

  if (!LIVE_KEY_ID.test(keyId) && !TEST_KEY_ID.test(keyId)) {
    return { ok: false, reason: "invalid_key_id" };
  }
  return { ok: true, keyId, keySecret };
}

export function hasWebhookSecret(secret?: string | null) {
  return Boolean(secret?.trim());
}
