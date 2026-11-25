"use client";

import { useActionState } from "react";
import { CheckCircle2, Clock3, Loader2, MessageCircle, ShieldCheck, XCircle } from "lucide-react";
import { submitManualPaymentAction } from "@/lib/payments/manual/owner-actions";
import { manualRequestStatusLabels } from "@/lib/payments/manual/config";
import { getBillingCycleLabel } from "@/lib/plans/billing-cycle";
import { formatDate, formatINR } from "@/lib/utils";
import type { OwnerManualRequest } from "@/lib/data/manual-requests";
import type { ManualRequestStatus } from "@/types/database.types";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { ok: true, message: "" };

function RequestStatus({ status }: { status: ManualRequestStatus }) {
  const className =
    status === "approved"
      ? "bg-emerald-50 text-emerald-800"
      : status === "rejected"
        ? "bg-rose-50 text-rose-800"
        : status === "under_verification"
          ? "bg-blue-50 text-blue-800"
          : "bg-amber-50 text-amber-800";
  const Icon =
    status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : status === "pending" ? Clock3 : ShieldCheck;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      <Icon size={13} />
      {manualRequestStatusLabels[status]}
    </span>
  );
}

function PaymentSubmissionForm({ request }: { request: OwnerManualRequest }) {
  const [state, formAction, pending] = useActionState(submitManualPaymentAction, initialState);

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-4 grid gap-3 rounded-lg border border-gold/30 bg-gold/5 p-4">
      <input type="hidden" name="requestId" value={request.id} />
      <p className="text-xs text-forest-deep">
        After completing the bank transfer or UPI payment in WhatsApp, enter the transaction reference and attach the confirmation screenshot here. Premium stays inactive until a Super Admin verifies and approves the payment.
      </p>
      <label className="grid gap-1 text-xs text-muted">
        Transaction reference or UTR
        <input
          name="paymentReference"
          required
          minLength={6}
          maxLength={64}
          autoComplete="off"
          placeholder="Example: UPI123456789"
          className="w-full rounded-lg border border-forest/15 bg-white px-3 py-2 text-sm text-forest-deep"
        />
        {state.fieldErrors?.paymentReference?.[0] ? (
          <span className="text-rose-600">{state.fieldErrors.paymentReference[0]}</span>
        ) : null}
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Payment confirmation screenshot
        <input
          name="proof"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="w-full rounded-lg border border-forest/15 bg-white px-3 py-2 text-sm text-forest-deep"
        />
        {state.fieldErrors?.proof?.[0] ? (
          <span className="text-rose-600">{state.fieldErrors.proof[0]}</span>
        ) : null}
      </label>
      <button type="submit" disabled={pending} className="btn-primary justify-center disabled:opacity-60">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
        {pending ? "Submitting..." : "Submit payment details"}
      </button>
      {state.message ? (
        <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-600"}>{state.message}</p>
      ) : null}
    </form>
  );
}

export function ManualSubscriptionRequestsSection({ requests }: { requests: OwnerManualRequest[] }) {
  return (
    <section className="surface-card mt-6 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-forest/10 px-6 py-4">
        <MessageCircle size={16} className="text-gold" />
        <h2 className="font-serif text-xl text-forest-deep">Manual subscription requests</h2>
      </div>
      {requests.length ? (
        <div className="divide-y divide-forest/8">
          {requests.map((request) => (
            <div key={request.id} className="px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-forest-deep">
                    {request.plan?.name ?? "Premium"} · {formatINR(request.amount / 100)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {getBillingCycleLabel(request.billing_cycle)} · Requested {formatDate(request.created_at)}
                  </p>
                  {request.payment_reference ? (
                    <p className="mt-0.5 text-xs text-muted">Reference: {request.payment_reference}</p>
                  ) : null}
                  {request.verified_reference ? (
                    <p className="mt-0.5 text-xs text-muted">Verified reference: {request.verified_reference}</p>
                  ) : null}
                  {request.rejection_reason ? (
                    <p className="mt-1 text-xs text-rose-700">Reason: {request.rejection_reason}</p>
                  ) : null}
                </div>
                <RequestStatus status={request.status} />
              </div>
              {request.status === "pending" ? <PaymentSubmissionForm request={request} /> : null}
              {request.status === "payment_submitted" ? (
                <p className="mt-3 text-xs text-muted">Payment details received. Waiting for Super Admin verification.</p>
              ) : null}
              {request.status === "under_verification" ? (
                <p className="mt-3 text-xs text-muted">Bank or UPI credit verified. Waiting for final approval.</p>
              ) : null}
              {request.status === "approved" ? (
                <p className="mt-3 text-xs text-emerald-700">Premium was activated for this verified payment. No further action is needed.</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-6 py-8 text-center text-sm text-muted">
          No manual payment requests yet. Choose a Premium duration above to start one.
        </p>
      )}
    </section>
  );
}
