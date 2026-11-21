import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServerClient } from "@/lib/supabase/server";

export type RateLimitedAction =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "enquiry"
  | "review"
  | "contact"
  | "upload";

type LimitConfig = { limit: number; windowSeconds: number };

const limits: Record<RateLimitedAction, LimitConfig> = {
  login: { limit: 8, windowSeconds: 600 },
  register: { limit: 5, windowSeconds: 3600 },
  "forgot-password": { limit: 5, windowSeconds: 3600 },
  "reset-password": { limit: 8, windowSeconds: 3600 },
  enquiry: { limit: 6, windowSeconds: 600 },
  review: { limit: 5, windowSeconds: 600 },
  contact: { limit: 5, windowSeconds: 600 },
  upload: { limit: 20, windowSeconds: 3600 },
};

const localBuckets = new Map<string, { windowStart: number; hits: number }>();

function hashSubject(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function requestSubject(extra?: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const userAgent = requestHeaders.get("user-agent")?.trim() ?? "";
  return hashSubject(`${forwarded || realIp || "unknown"}|${userAgent}|${extra ?? ""}`);
}

function localConsume(action: RateLimitedAction, subject: string, config: LimitConfig) {
  const key = `${action}:${subject}`;
  const now = Date.now();
  const current = localBuckets.get(key);
  if (!current || now - current.windowStart >= config.windowSeconds * 1000) {
    localBuckets.set(key, { windowStart: now, hits: 1 });
    return true;
  }
  current.hits += 1;
  return current.hits <= config.limit;
}

export async function enforceRateLimit(action: RateLimitedAction, extra?: string) {
  const config = limits[action];
  const subject = await requestSubject(extra);
  const supabase = await getServerClient();

  if (supabase) {
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_action: action,
      p_subject: subject,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    });
    if (!error && typeof data === "boolean") return data;
    if (error && error.code !== "PGRST202") return false;
  }

  return localConsume(action, subject, config);
}
