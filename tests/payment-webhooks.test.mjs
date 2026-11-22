import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canActivatePaymentStatus,
  isSupportedWebhookEvent,
  parseWebhookEvent,
} from "../src/lib/payments/payment-check.ts";
import { verifyWebhookSignature } from "../src/lib/payments/signatures.ts";

const migration = readFileSync(
  new URL("../supabase/migrations/0013_payment_security.sql", import.meta.url),
  "utf8",
);
const secret = "webhook_secret";

const capturedEvent = (overrides = {}) => ({
  id: "evt_1",
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_1",
        order_id: "order_1",
        amount: 49900,
        currency: "INR",
        status: "captured",
      },
    },
  },
  ...overrides,
});

test("valid webhook signature is accepted", () => {
  const raw = JSON.stringify(capturedEvent());
  const signature = createHmac("sha256", secret).update(raw).digest("hex");
  assert.equal(verifyWebhookSignature(secret, raw, signature), true);
});

test("invalid webhook signature is rejected", () => {
  const raw = JSON.stringify(capturedEvent());
  assert.equal(verifyWebhookSignature(secret, raw, "bad"), false);
  assert.equal(verifyWebhookSignature("wrong_secret", raw, createHmac("sha256", secret).update(raw).digest("hex")), false);
});

test("captured webhook payload is parsed for owner-safe activation", () => {
  const summary = parseWebhookEvent(capturedEvent());
  assert.equal(summary.eventId, "evt_1");
  assert.equal(summary.eventType, "payment.captured");
  assert.equal(summary.paymentId, "pay_1");
  assert.equal(summary.orderId, "order_1");
  assert.equal(summary.status, "captured");
  assert.equal(isSupportedWebhookEvent(summary.eventType), true);
});

test("duplicate webhook events are deduplicated in the database", () => {
  assert.match(migration, /create table if not exists public\.payment_events/);
  assert.match(migration, /event_id text primary key/);
  assert.match(migration, /on conflict \(event_id\) do nothing/);
  assert.match(migration, /reserve_payment_event/);
});

test("unknown webhook events are ignored", () => {
  assert.equal(isSupportedWebhookEvent("payment.authorized"), false);
  assert.equal(isSupportedWebhookEvent("order.created"), false);
  const summary = parseWebhookEvent({ id: "evt_2", event: "unknown.event" });
  assert.equal(summary.eventType, "unknown.event");
});

test("failed payment events do not activate subscriptions", () => {
  const summary = parseWebhookEvent({
    id: "evt_3",
    event: "payment.failed",
    payload: { payment: { entity: { id: "pay_2", order_id: "order_2", status: "failed" } } },
  });
  assert.equal(summary.eventType, "payment.failed");
  assert.equal(summary.status, "failed");
  assert.equal(isSupportedWebhookEvent(summary.eventType), true);
  assert.match(migration, /p_status not in \('failed', 'refunded'\)/);
});

test("already processed payments cannot be activated again", () => {
  assert.equal(canActivatePaymentStatus("success"), false);
  assert.match(migration, /if v_payment\.status = 'success' then/);
  assert.match(migration, /'Payment already recorded\.'/);
});
