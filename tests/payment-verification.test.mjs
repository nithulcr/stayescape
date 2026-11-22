import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  createPaymentSignature,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../src/lib/payments/signatures.ts";
import {
  canActivatePaymentStatus,
  checkRazorpayPayment,
  isPaymentOwner,
} from "../src/lib/payments/payment-check.ts";

const secret = "test_secret";
const orderId = "order_1";
const paymentId = "pay_1";
const signature = createPaymentSignature(secret, orderId, paymentId);

const gatewayPayment = () => ({
  id: paymentId,
  order_id: orderId,
  amount: 49900,
  currency: "INR",
  status: "captured",
});

const check = (overrides = {}) =>
  checkRazorpayPayment({
    expectedOrderId: orderId,
    expectedPaymentId: paymentId,
    expectedAmount: 49900,
    expectedCurrency: "INR",
    payment: { ...gatewayPayment(), ...overrides },
  });

test("valid payment signature is accepted", () => {
  assert.equal(verifyPaymentSignature(secret, orderId, paymentId, signature), true);
});

test("invalid payment signature is rejected", () => {
  assert.equal(verifyPaymentSignature(secret, orderId, paymentId, "bad-signature"), false);
  assert.equal(verifyPaymentSignature("wrong_secret", orderId, paymentId, signature), false);
  assert.equal(verifyPaymentSignature(secret, "order_2", paymentId, signature), false);
  assert.equal(verifyPaymentSignature(secret, orderId, "pay_2", signature), false);
});

test("payment must belong to the expected order", () => {
  const result = check({ order_id: "order_2" });
  assert.equal(result.ok, false);
  assert.match(result.message, /order/i);
});

test("payment owner must match the authenticated user", () => {
  assert.equal(isPaymentOwner("owner-1", "owner-1"), true);
  assert.equal(isPaymentOwner("owner-1", "owner-2"), false);
  assert.equal(isPaymentOwner(null, "owner-1"), false);
});

test("wrong amount and wrong currency are rejected", () => {
  const wrongAmount = check({ amount: 100 });
  assert.equal(wrongAmount.ok, false);
  assert.match(wrongAmount.message, /amount/i);

  const wrongCurrency = check({ currency: "USD" });
  assert.equal(wrongCurrency.ok, false);
  assert.match(wrongCurrency.message, /currency/i);
});

test("uncaptured or missing payments are rejected", () => {
  assert.equal(check({ status: "authorized" }).ok, false);
  assert.equal(checkRazorpayPayment({
    expectedOrderId: orderId,
    expectedPaymentId: paymentId,
    expectedAmount: 49900,
    expectedCurrency: "INR",
    payment: null,
  }).ok, false);
});

test("duplicate verification cannot activate an already recorded payment", () => {
  assert.equal(canActivatePaymentStatus("pending"), true);
  assert.equal(canActivatePaymentStatus("failed"), true);
  assert.equal(canActivatePaymentStatus("success"), false);
  assert.equal(canActivatePaymentStatus("refunded"), false);
});

test("webhook signatures use the shared verifier", () => {
  const payload = JSON.stringify({ event: "payment.captured" });
  const webhookSignature = createHmac("sha256", secret).update(payload).digest("hex");
  assert.equal(verifyWebhookSignature(secret, payload, webhookSignature), true);
  assert.equal(verifyWebhookSignature(secret, payload, "bad"), false);
});
