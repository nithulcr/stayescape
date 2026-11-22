import { createHmac, timingSafeEqual } from "node:crypto";

function matches(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createPaymentSignature(secret: string, orderId: string, paymentId: string) {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyPaymentSignature(
  secret: string,
  orderId: string,
  paymentId: string,
  signature: string,
) {
  if (!secret || !orderId || !paymentId || !signature) return false;
  return matches(createPaymentSignature(secret, orderId, paymentId), signature);
}

export function createWebhookSignature(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string,
) {
  if (!secret || !payload || !signature) return false;
  return matches(createWebhookSignature(secret, payload), signature);
}
