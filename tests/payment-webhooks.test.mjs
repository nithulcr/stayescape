import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canActivatePaymentStatus,
  checkRefundEvent,
  isSuccessfulRefundStatus,
  isSupportedWebhookEvent,
  parseWebhookEvent,
} from "../src/lib/payments/payment-check.ts";
import { verifyWebhookSignature } from "../src/lib/payments/signatures.ts";

const migration = readFileSync(
  new URL("../supabase/migrations/0013_payment_security.sql", import.meta.url),
  "utf8",
);
const refundMigration = readFileSync(
  new URL("../supabase/migrations/0028_record_refund_details.sql", import.meta.url),
  "utf8",
);
const refundCapMigration = readFileSync(
  new URL("../supabase/migrations/0029_atomic_refund_limits.sql", import.meta.url),
  "utf8",
);
const webhookRoute = readFileSync(
  new URL("../src/app/api/payments/webhook/route.ts", import.meta.url),
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

test("refund webhook payload is parsed with refund identifiers and amounts", () => {
  const summary = parseWebhookEvent({
    id: "evt_refund",
    event: "refund.created",
    payload: {
      refund: {
        entity: {
          id: "refund_1",
          payment_id: "pay_1",
          amount: 49900,
          currency: "INR",
          status: "processed",
        },
      },
    },
  });
  assert.equal(summary.eventId, "evt_refund");
  assert.equal(summary.eventType, "refund.created");
  assert.equal(summary.paymentId, "pay_1");
  assert.equal(summary.refundId, "refund_1");
  assert.equal(summary.amount, 49900);
  assert.equal(summary.currency, "INR");
  assert.equal(summary.status, "processed");
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

test("refund persistence records refund details without touching subscriptions", () => {
  assert.match(refundMigration, /create table if not exists public\.payment_refunds/);
  assert.match(refundMigration, /refund_id text primary key/);
  assert.match(refundMigration, /event_id text unique references public\.payment_events/);
  assert.match(refundMigration, /add column if not exists razorpay_refund_id text/);
  assert.match(refundMigration, /add column if not exists refunded_amount integer/);
  assert.match(refundMigration, /set status = 'refunded'/);
  assert.match(refundMigration, /on conflict \(refund_id\) do nothing/);
  assert.match(refundMigration, /reserve_payment_event/);
  assert.doesNotMatch(refundMigration, /update public\.subscriptions/);
});

test("pending and failed refunds are not treated as successful", () => {
  assert.equal(isSuccessfulRefundStatus("processed"), true);
  assert.equal(isSuccessfulRefundStatus("refunded"), true);
  assert.equal(isSuccessfulRefundStatus("SUCCESS"), true);
  assert.equal(isSuccessfulRefundStatus("pending"), false);
  assert.equal(isSuccessfulRefundStatus("failed"), false);
  assert.equal(isSuccessfulRefundStatus(null), false);
});

test("refund events require positive amounts and matching currency", () => {
  const valid = {
    amount: 49900,
    currency: "INR",
    status: "processed",
    expectedCurrency: "inr",
  };
  assert.deepEqual(checkRefundEvent(valid), { ok: true });
  assert.equal(checkRefundEvent({ ...valid, amount: 0 }).ok, false);
  assert.equal(checkRefundEvent({ ...valid, amount: -100 }).ok, false);
  assert.equal(checkRefundEvent({ ...valid, amount: 12.5 }).ok, false);
  assert.equal(checkRefundEvent({ ...valid, amount: null }).ok, false);
  assert.equal(checkRefundEvent({ ...valid, currency: "USD" }).ok, false);
  assert.equal(checkRefundEvent({ ...valid, status: "failed" }).ok, false);
});

test("refund amounts are validated atomically in the database", () => {
  assert.match(refundCapMigration, /for update/);
  assert.match(refundCapMigration, /p_refund_amount is null or p_refund_amount <= 0/);
  assert.match(refundCapMigration, /upper\(btrim\(v_payment\.currency\)\) <> v_currency/);
  assert.match(refundCapMigration, /lower\(pr\.status\) in \('processed', 'refunded', 'success'\)/);
  assert.match(refundCapMigration, /v_new_total := v_total \+ v_amount/);
  assert.match(refundCapMigration, /v_new_total > v_payment\.amount/);
  assert.match(refundCapMigration, /on conflict \(refund_id\) do nothing/);
  assert.match(refundCapMigration, /'Refund already recorded\.'/);
  assert.match(refundCapMigration, /'Partial refund recorded\.'/);
  assert.doesNotMatch(refundCapMigration, /update public\.subscriptions/);
});

test("webhook routes refunds to dedicated persistence and skips replayed activations", () => {
  assert.match(webhookRoute, /canActivatePaymentStatus/);
  assert.match(webhookRoute, /recordRefund/);
  assert.match(webhookRoute, /refundId: event\.refundId/);
  assert.match(webhookRoute, /refundAmount: event\.amount/);
  assert.match(webhookRoute, /refundCurrency: event\.currency/);
  assert.match(webhookRoute, /refundStatus: event\.status/);
  assert.match(webhookRoute, /event\.eventType === "refund\.created"/);
  assert.match(webhookRoute, /isSuccessfulRefundStatus/);
  assert.match(webhookRoute, /checkRefundEvent/);
  assert.match(webhookRoute, /razorpayWebhookConfigured/);
  assert.match(webhookRoute, /Payment gateway is not configured/);
});
