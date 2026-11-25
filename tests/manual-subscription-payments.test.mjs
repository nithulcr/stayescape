import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildManualWhatsAppUrl } from "../src/lib/payments/manual/message.ts";
import {
  isManualRequestStatus,
  normalizePaymentReference,
} from "../src/lib/payments/manual/validation.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../supabase/migrations/0030_manual_subscription_requests.sql");
const initial = read("../supabase/migrations/0001_initial_schema.sql");
const renewalPolicy = read("../supabase/migrations/0026_subscription_expiry_lifecycle.sql");
const ownerActions = read("../src/lib/payments/manual/owner-actions.ts");
const adminActions = read("../src/app/admin/manual-requests/actions.ts");
const manualData = read("../src/lib/data/manual-requests.ts");
const whatsappButton = read("../src/components/payments/whatsapp-checkout-button.tsx");
const ownerSection = read("../src/components/dashboard/manual-subscription-requests.tsx");
const adminManager = read("../src/components/admin/manual-request-manager.tsx");
const subscriptionPage = read("../src/app/dashboard/subscription/page.tsx");
const pricingPage = read("../src/app/(public)/pricing/page.tsx");
const checkoutButton = read("../src/components/payments/checkout-button.tsx");
const createOrderRoute = read("../src/app/api/payments/create-order/route.ts");
const webhookRoute = read("../src/app/api/payments/webhook/route.ts");
const config = read("../src/lib/config.ts");

function functionBody(source, name, nextName) {
  const start = source.indexOf(`create or replace function public.${name}`);
  const endMarker = nextName.startsWith("alter table")
    ? nextName
    : `create or replace function public.${nextName}`;
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

test("WhatsApp requests are prefilled with server-calculated plan details", () => {
  const url = buildManualWhatsAppUrl({
    ownerName: "Asha Nair",
    ownerId: "owner-123",
    planName: "Premium",
    amount: "₹2,499",
    durationLabel: "6 months",
  });
  const parsed = new URL(url);
  assert.equal(`${parsed.origin}${parsed.pathname}`, "https://wa.me/919946844274");

  const message = parsed.searchParams.get("text") ?? "";
  assert.match(message, /^Stay Escape Premium subscription request/);
  assert.match(message, /Owner: Asha Nair/);
  assert.match(message, /Owner account ID: owner-123/);
  assert.match(message, /Plan: Premium/);
  assert.match(message, /Amount: ₹2,499/);
  assert.match(message, /Duration: 6 months/);
  assert.doesNotMatch(message, /@/);
});

test("payment references are normalized and validated before submission", () => {
  assert.equal(normalizePaymentReference(" upi123456789 "), "UPI123456789");
  assert.equal(normalizePaymentReference("abc/123-456"), "ABC/123-456");
  assert.equal(normalizePaymentReference("short"), null);
  assert.equal(normalizePaymentReference("bad reference!"), null);
  assert.equal(normalizePaymentReference(null), null);
  assert.equal(isManualRequestStatus("under_verification"), true);
  assert.equal(isManualRequestStatus("approved"), true);
  assert.equal(isManualRequestStatus("paid"), false);
});

test("opening WhatsApp only creates a pending request and never activates Premium", () => {
  assert.match(ownerActions, /create_manual_subscription_request/);
  assert.match(whatsappButton, /startManualRequestAction\(billingCycle\)/);
  assert.match(whatsappButton, /window\.open\(result\.whatsappUrl/);
  assert.doesNotMatch(ownerActions, /activate_paid_subscription/);
  assert.doesNotMatch(ownerActions, /from\("subscriptions"\)/);
  assert.doesNotMatch(ownerActions, /from\("payments"\)/);
  assert.match(migration, /status = 'pending'/);
  assert.match(migration, /revoke all on function public\.create_manual_subscription_request\(uuid, uuid, public\.billing_cycle, integer, text, integer, uuid, text\) from public/);
  assert.match(migration, /grant execute on function public\.create_manual_subscription_request\(uuid, uuid, public\.billing_cycle, integer, text, integer, uuid, text\) to authenticated, service_role/);
  assert.doesNotMatch(migration, /create_manual_subscription_request\(uuid, uuid, public\.billing_cycle, integer, integer, text/);
  assert.doesNotMatch(
    functionBody(migration, "create_manual_subscription_request", "owner_submit_manual_payment"),
    /insert into public\.subscriptions|insert into public\.payments/i,
  );
});

test("owners submit a validated transaction reference and protected proof", () => {
  assert.match(ownerActions, /normalizePaymentReference\(formData\.get\("paymentReference"\)\)/);
  assert.match(ownerActions, /owner_submit_manual_payment/);
  assert.match(ownerActions, /p_payment_reference: paymentReference/);
  assert.match(ownerActions, /validateImageUpload\(proof\)/);
  assert.match(ownerActions, /manualPaymentProofBucket/);
  assert.match(ownerActions, /enforceRateLimit\("upload"/);
  assert.match(ownerSection, /name="paymentReference"/);
  assert.match(ownerSection, /name="proof"[\s\S]*?type="file"/);

  const submitRequest = functionBody(migration, "owner_submit_manual_payment", "admin_verify_manual_payment");
  assert.match(submitRequest, /v_reference !~ '\^\[A-Z0-9\]\[A-Z0-9\/_-\]\{5,63\}\$'/);
  assert.match(submitRequest, /v_request\.status <> 'pending'/);
  assert.match(submitRequest, /status = 'payment_submitted'/);
  assert.match(submitRequest, /unique_violation/);
  assert.match(submitRequest, /v_request\.owner_id <> p_actor_id/);
});

test("owners and admins cannot approve manual payments", () => {
  assert.doesNotMatch(ownerActions, /admin_approve_manual_request/);
  assert.doesNotMatch(ownerSection, /Approve and activate/);
  assert.match(adminActions, /requireSuperAdmin\(\)/);
  assert.match(adminActions, /admin_approve_manual_request/);
  assert.doesNotMatch(migration, /public\.is_admin\(\)/);

  const approve = functionBody(migration, "admin_approve_manual_request", "alter table public.manual_subscription_requests");
  const adminGuard = functionBody(migration, "assert_manual_request_admin", "create_manual_subscription_request");
  assert.match(approve, /perform public\.assert_manual_request_admin/);
  assert.match(adminGuard, /not public\.is_super_admin\(\) or auth\.uid\(\) is null or auth\.uid\(\) <> p_actor_id/);
});

test("Super Admin approval requires an external credit verification step", () => {
  const verify = functionBody(migration, "admin_verify_manual_payment", "admin_reject_manual_request");
  assert.match(verify, /p_bank_credit_verified is not true/);
  assert.match(verify, /v_request\.status <> 'payment_submitted'/);
  assert.match(verify, /verified_at = now\(\)/);
  assert.match(verify, /verified_by = p_actor_id/);
  assert.match(verify, /verified_reference = v_reference/);
  assert.match(verify, /status = 'under_verification'/);
  assert.match(adminActions, /bankCreditVerified/);
  assert.match(adminManager, /I checked that the amount was actually credited/);

  const approve = functionBody(migration, "admin_approve_manual_request", "alter table public.manual_subscription_requests");
  assert.match(approve, /status <> 'under_verification'/);
  assert.match(approve, /verified_at is null/);
  assert.match(approve, /verified_by is null/);
  assert.match(approve, /coalesce\(v_request\.verified_reference, ''\)/);
  assert.match(approve, /status = 'active'/);
  assert.match(approve, /source = 'manual'/);
  assert.match(approve, /make_interval\(months => v_request\.duration_months\)/);
  assert.match(approve, /greatest\(now\(\), coalesce\(v_subscription\.expires_at, now\(\)\)\)/);
});

test("duplicate transaction references and approval events cannot grant Premium twice", () => {
  assert.match(migration, /create unique index if not exists manual_requests_active_reference_unique/);
  assert.match(migration, /upper\(btrim\(payment_reference\)\)/);
  assert.match(migration, /create unique index if not exists manual_requests_verified_reference_unique/);
  assert.match(migration, /upper\(btrim\(verified_reference\)\)/);
  assert.match(migration, /create table if not exists public\.manual_request_active_references/);
  assert.match(migration, /after insert or update of status, payment_reference, verified_reference or delete/);
  assert.match(migration, /values \(new\.payment_reference\), \(new\.verified_reference\)/);
  assert.match(migration, /revoke all on table public\.manual_request_active_references from public, anon, authenticated/);
  assert.match(migration, /if v_request\.status = 'approved' and v_request\.approved_subscription_id is not null then/);
  assert.match(migration, /'duplicate', true/);
  assert.match(migration, /other\.status in \('payment_submitted', 'under_verification', 'approved'\)/);
  assert.match(migration, /upper\(btrim\(other\.payment_reference\)\) in \(/);
  assert.match(migration, /upper\(btrim\(other\.verified_reference\)\) in \(/);
  assert.match(initial, /create unique index subscriptions_one_active_per_owner/);
  assert.match(adminActions, /This payment was already approved\. Premium was not extended again\./);
});

test("rejected requests never change subscriptions or property visibility", () => {
  const reject = functionBody(migration, "admin_reject_manual_request", "admin_approve_manual_request");
  assert.match(reject, /status = 'rejected'/);
  assert.match(reject, /Premium was not changed/);
  assert.doesNotMatch(reject, /update public\.subscriptions/i);
  assert.doesNotMatch(reject, /insert into public\.subscriptions/i);
  assert.doesNotMatch(reject, /update public\.properties/i);
  assert.match(ownerSection, /Premium stays inactive until a Super Admin verifies and approves/);
});

test("manual payment records keep an audit trail and private proof attachments", () => {
  assert.match(migration, /create table if not exists public\.manual_request_history/);
  assert.match(migration, /record_manual_request_audit/);
  assert.match(migration, /revoke all on function public\.record_manual_request_history\(uuid, uuid, text, text, text, text\) from public/);
  assert.match(migration, /revoke all on function public\.record_manual_request_audit\(uuid, text, text, uuid, jsonb\) from public/);
  assert.match(migration, /revoke all on function public\.assert_manual_request_owner\(uuid\) from public/);
  assert.match(migration, /revoke all on function public\.assert_manual_request_admin\(uuid, text\) from public/);
  assert.match(migration, /revoke all on function public\.sync_manual_request_active_references\(\) from public/);
  assert.match(migration, /'manual_payment\.verified'/);
  assert.match(migration, /'manual_payment\.approved'/);
  assert.match(migration, /'manual_payment\.rejected'/);
  assert.match(migration, /'manual-payment-proofs'[\s\S]*?false/);
  assert.match(migration, /Super admins can read manual payment proofs/);
  assert.match(migration, /public\.is_super_admin\(\)/);
  assert.doesNotMatch(migration, /Public can read manual payment proofs/);
  assert.match(config, /manualPaymentProofBucket/);
  assert.match(manualData, /createSignedUrl/);
});

test("Razorpay integration stays intact but has no active checkout entry point", () => {
  assert.match(checkoutButton, /checkout\.razorpay\.com\/v1\/checkout\.js/);
  assert.match(checkoutButton, /api\/payments\/create-order/);
  assert.match(createOrderRoute, /preparePremiumOrder/);
  assert.match(createOrderRoute, /razorpay\.orders\.create/);
  assert.match(webhookRoute, /razorpayWebhookConfigured/);
  assert.doesNotMatch(subscriptionPage, /from "@\/components\/payments\/checkout-button"/);
  assert.doesNotMatch(pricingPage, /from "@\/components\/payments\/checkout-button"/);
  assert.doesNotMatch(subscriptionPage, /<CheckoutButton[\s/>]/);
  assert.doesNotMatch(pricingPage, /<CheckoutButton[\s/>]/);
  assert.match(subscriptionPage, /WhatsAppCheckoutButton/);
  assert.match(pricingPage, /WhatsAppCheckoutButton/);
  assert.doesNotMatch(pricingPage, /Payments are processed securely by Razorpay/);
});

test("premium entitlement, property limits, and renewal restoration remain unchanged", () => {
  assert.doesNotMatch(migration, /delete from public\.properties/i);
  assert.doesNotMatch(migration, /delete from public\.property_images/i);
  assert.doesNotMatch(migration, /update public\.properties/i);
  assert.match(migration, /pl\.is_active/);
  assert.match(migration, /amount = \([\s\S]*?price_six_month[\s\S]*?price_yearly/);
  assert.match(renewalPolicy, /create or replace function public\.restore_properties_after_renewal/);
  assert.match(renewalPolicy, /publish_after_renewal = false/);
  assert.match(initial, /create unique index subscriptions_one_active_per_owner/);
});
