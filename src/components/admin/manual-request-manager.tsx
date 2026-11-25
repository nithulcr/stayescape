"use client";

import { useActionState } from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, XCircle } from "lucide-react";
import {
  approveManualPaymentAction,
  rejectManualPaymentAction,
  verifyManualPaymentAction,
} from "@/app/admin/manual-requests/actions";
import {
  manualApprovalConfirmation,
  manualRequestStatusLabels,
} from "@/lib/payments/manual/config";
import { getBillingCycleLabel } from "@/lib/plans/billing-cycle";
import { formatDate, formatINR } from "@/lib/utils";
import type { AdminManualRequest } from "@/lib/data/manual-requests";
import type { ManualRequestStatus } from "@/types/database.types";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { ok: true, message: "" };

function statusClass(status: ManualRequestStatus) {
  if (status === "approved") return "bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "bg-rose-50 text-rose-800";
  if (status === "under_verification") return "bg-blue-50 text-blue-800";
  return "bg-amber-50 text-amber-800";
}

function VerifyForm({ request }: { request: AdminManualRequest }) {
  const [state, formAction, pending] = useActionState(verifyManualPaymentAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4">
      <input type="hidden" name="requestId" value={request.id} />
      <p className="text-xs text-blue-950">
        Check the business bank account or UPI statement for a real credit of {formatINR(request.amount / 100)}. Enter the actual reference shown there, not only the screenshot text.
      </p>
      <label className="grid gap-1 text-xs text-muted">
        Actual bank or UPI reference
        <input
          name="verifiedReference"
          required
          minLength={6}
          maxLength={64}
          defaultValue={request.payment_reference ?? ""}
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-forest-deep"
        />
        {state.fieldErrors?.verifiedReference?.[0] ? (
          <span className="text-rose-600">{state.fieldErrors.verifiedReference[0]}</span>
        ) : null}
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Verification notes
        <textarea
          name="notes"
          rows={2}
          maxLength={1000}
          placeholder="Optional bank or UPI verification note"
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-forest-deep"
        />
      </label>
      <label className="flex items-start gap-2 text-xs text-blue-950">
        <input name="bankCreditVerified" type="checkbox" required className="mt-0.5" />
        I checked that the amount was actually credited to the Stay Escape business bank or UPI account.
      </label>
      <button type="submit" disabled={pending} className="btn-primary justify-center disabled:opacity-60">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
        {pending ? "Saving verification..." : "Mark payment verified"}
      </button>
      {state.message ? (
        <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-600"}>{state.message}</p>
      ) : null}
    </form>
  );
}

function ApproveForm({ request }: { request: AdminManualRequest }) {
  const [state, formAction, pending] = useActionState(approveManualPaymentAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
      <input type="hidden" name="requestId" value={request.id} />
      <p className="text-xs text-emerald-950">
        Approval activates Premium immediately and extends from the later of today or the current expiry. It cannot be undone from this screen.
      </p>
      <label className="grid gap-1 text-xs text-muted">
        Approval notes
        <textarea
          name="notes"
          rows={2}
          maxLength={1000}
          placeholder="Optional approval note"
          className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-forest-deep"
        />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Type {manualApprovalConfirmation} to confirm
        <input
          name="confirmation"
          required
          autoComplete="off"
          className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-forest-deep"
        />
        {state.fieldErrors?.confirmation?.[0] ? (
          <span className="text-rose-600">{state.fieldErrors.confirmation[0]}</span>
        ) : null}
      </label>
      <button type="submit" disabled={pending} className="btn-primary justify-center disabled:opacity-60">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        {pending ? "Approving..." : "Approve and activate Premium"}
      </button>
      {state.message ? (
        <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-600"}>{state.message}</p>
      ) : null}
    </form>
  );
}

function RejectForm({ request }: { request: AdminManualRequest }) {
  const [state, formAction, pending] = useActionState(rejectManualPaymentAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-lg border border-rose-200 bg-rose-50/60 p-4">
      <input type="hidden" name="requestId" value={request.id} />
      <label className="grid gap-1 text-xs text-muted">
        Rejection reason
        <textarea
          name="reason"
          required
          minLength={3}
          maxLength={500}
          rows={2}
          placeholder="Explain why this payment cannot be approved"
          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-forest-deep"
        />
        {state.fieldErrors?.reason?.[0] ? (
          <span className="text-rose-600">{state.fieldErrors.reason[0]}</span>
        ) : null}
      </label>
      <button type="submit" disabled={pending} className="btn-secondary justify-center border-rose-300 text-rose-700 disabled:opacity-60">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
        {pending ? "Rejecting..." : "Reject request"}
      </button>
      {state.message ? (
        <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-600"}>{state.message}</p>
      ) : null}
    </form>
  );
}

function RequestCard({ request }: { request: AdminManualRequest }) {
  const canVerify = request.status === "payment_submitted";
  const canApprove = request.status === "under_verification";
  const canReject = ["pending", "payment_submitted", "under_verification"].includes(request.status);

  return (
    <article className="border-b border-forest/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-forest-deep">
            {request.owner?.full_name ?? "Stay Escape owner"} · {formatINR(request.amount / 100)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{request.owner?.email ?? "Owner email unavailable"}</p>
          <p className="mt-0.5 text-xs text-muted">
            {request.plan?.name ?? "Premium"} · {getBillingCycleLabel(request.billing_cycle)} · {request.duration_months} month{request.duration_months === 1 ? "" : "s"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(request.status)}`}>
          {manualRequestStatusLabels[request.status]}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-forest-deep">Requested</dt>
          <dd>{formatDate(request.created_at)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-forest-deep">Submitted reference</dt>
          <dd>{request.payment_reference ?? "Not submitted"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-forest-deep">Verified reference</dt>
          <dd>{request.verified_reference ?? "Not verified"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-forest-deep">Verified by</dt>
          <dd>
            {request.verifiedBy?.full_name ?? request.verifiedBy?.email ?? "—"}
            {request.verified_at ? ` · ${formatDate(request.verified_at)}` : ""}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-forest-deep">Proof</dt>
          <dd>
            {request.proofUrl ? (
              <a href={request.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-forest underline">
                View screenshot <ExternalLink size={12} />
              </a>
            ) : (
              "No proof uploaded"
            )}
          </dd>
        </div>
        {request.rejection_reason ? (
          <div>
            <dt className="font-semibold text-forest-deep">Rejection reason</dt>
            <dd>{request.rejection_reason}</dd>
          </div>
        ) : null}
        {request.admin_notes ? (
          <div>
            <dt className="font-semibold text-forest-deep">Admin notes</dt>
            <dd>{request.admin_notes}</dd>
          </div>
        ) : null}
      </dl>

      {canVerify ? <VerifyForm request={request} /> : null}
      {canApprove ? <ApproveForm request={request} /> : null}
      {canReject ? <RejectForm request={request} /> : null}
    </article>
  );
}

export function ManualRequestManager({ requests }: { requests: AdminManualRequest[] }) {
  if (!requests.length) {
    return <p className="px-6 py-8 text-center text-sm text-muted">No manual payment requests yet.</p>;
  }

  return (
    <div>
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}
