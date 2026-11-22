"use client";

import { useActionState, useState } from "react";
import {
  extendPremiumAction,
  grantPremiumAction,
  revokePremiumAction,
} from "@/app/admin/actions";
import { ADMIN_GRANT_REASONS } from "@/lib/subscriptions/admin-grants";
import type { ActionResult } from "@/types";

type Mode = "grant" | "extend" | "revoke";

export type ManageableAdminUser = {
  id: string;
  name: string;
  email: string;
  planLabel: string;
  expiresAt: string | null;
  canGrant: boolean;
  canExtend: boolean;
  canRevoke: boolean;
};

const initialState: ActionResult = { ok: true, message: "" };

const durationOptions = [
  { value: "monthly", label: "1 month" },
  { value: "six_month", label: "6 months" },
  { value: "yearly", label: "12 months" },
  { value: "custom", label: "Custom duration" },
];

function fieldError(state: ActionResult, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function PremiumSubscriptionManager({ user }: { user: ManageableAdminUser }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("grant");
  const [grantState, grantFormAction, grantPending] = useActionState(grantPremiumAction, initialState);
  const [extendState, extendFormAction, extendPending] = useActionState(extendPremiumAction, initialState);
  const [revokeState, revokeFormAction, revokePending] = useActionState(revokePremiumAction, initialState);

  const [reason, setReason] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [confirmation, setConfirmation] = useState("");

  if (!user.canGrant && !user.canExtend && !user.canRevoke) return null;

  const availableModes: Mode[] = [
    ...(user.canGrant ? (["grant"] as Mode[]) : []),
    ...(user.canExtend ? (["extend"] as Mode[]) : []),
    ...(user.canRevoke ? (["revoke"] as Mode[]) : []),
  ];

  const openModal = (nextMode: Mode) => {
    setMode(nextMode);
    setReason("");
    setBillingCycle("monthly");
    setConfirmation("");
    setOpen(true);
  };

  const state = mode === "grant" ? grantState : mode === "extend" ? extendState : revokeState;
  const pending = mode === "grant" ? grantPending : mode === "extend" ? extendPending : revokePending;
  const formAction = mode === "grant" ? grantFormAction : mode === "extend" ? extendFormAction : revokeFormAction;

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {user.canGrant ? (
          <button type="button" onClick={() => openModal("grant")} className="btn-secondary !px-2 !py-1.5 text-xs">
            Grant
          </button>
        ) : null}
        {user.canExtend ? (
          <button type="button" onClick={() => openModal("extend")} className="btn-secondary !px-2 !py-1.5 text-xs">
            Extend
          </button>
        ) : null}
        {user.canRevoke ? (
          <button type="button" onClick={() => openModal("revoke")} className="btn-secondary !px-2 !py-1.5 text-xs text-rose-700">
            Revoke
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className="surface-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Manage Premium for ${user.name}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Super admin</p>
                <h2 className="mt-2 font-serif text-2xl text-forest-deep">
                  {mode === "grant" ? "Grant Premium" : mode === "extend" ? "Extend Premium" : "Revoke Premium"}
                </h2>
                <p className="mt-1 text-sm text-muted">{user.name} · {user.email}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-forest">
                Close
              </button>
            </div>

            <p className="mt-3 text-xs text-muted">Current plan: {user.planLabel}</p>
            {user.expiresAt ? <p className="text-xs text-muted">Expires: {user.expiresAt}</p> : null}

            {availableModes.length > 1 ? (
              <div className="mt-4 flex gap-2">
                {availableModes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => openModal(option)}
                    className={
                      option === mode
                        ? "rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-full border border-forest/15 px-3 py-1.5 text-xs font-semibold text-forest-deep"
                    }
                  >
                    {option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            ) : null}

            {mode === "grant" ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This will grant Premium access without creating a payment.
              </p>
            ) : null}
            {mode === "extend" ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This will extend Premium access without creating a payment.
              </p>
            ) : null}
            {mode === "revoke" ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900">
                This will end Premium access now. Payment and property records are not deleted.
              </p>
            ) : null}

            <form key={`${mode}-${user.id}`} action={formAction} className="mt-5 grid gap-4">
              <input type="hidden" name="userId" value={user.id} />

              {mode !== "revoke" ? (
                <>
                  <label className="flex flex-col gap-1 text-xs text-muted">
                    Duration
                    <select
                      name="billingCycle"
                      value={billingCycle}
                      onChange={(event) => setBillingCycle(event.target.value)}
                      className="input-field"
                      required
                    >
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fieldError(state, "duration") ? (
                    <p className="text-xs text-rose-700">{fieldError(state, "duration")}</p>
                  ) : null}
                  {billingCycle === "custom" ? (
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Custom months (1-120)
                      <input name="customMonths" type="number" min={1} max={120} className="input-field" required />
                    </label>
                  ) : null}
                </>
              ) : null}

              {mode === "grant" ? (
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Start date (optional)
                  <input name="startAt" type="datetime-local" className="input-field" />
                </label>
              ) : null}
              {fieldError(state, "startAt") ? (
                <p className="text-xs text-rose-700">{fieldError(state, "startAt")}</p>
              ) : null}

              <label className="flex flex-col gap-1 text-xs text-muted">
                Reason
                <select
                  name="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a reason</option>
                  {ADMIN_GRANT_REASONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {reason === "Other" ? (
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Other reason
                  <input name="otherReason" type="text" minLength={3} maxLength={200} className="input-field" required />
                </label>
              ) : null}
              {fieldError(state, "reason") ? (
                <p className="text-xs text-rose-700">{fieldError(state, "reason")}</p>
              ) : null}

              <label className="flex flex-col gap-1 text-xs text-muted">
                Internal notes (optional)
                <textarea name="notes" rows={3} maxLength={2000} className="input-field" />
              </label>

              {mode === "revoke" ? (
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Type REVOKE to confirm
                  <input
                    name="confirm"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    className="input-field"
                    autoComplete="off"
                    required
                  />
                </label>
              ) : null}
              {fieldError(state, "confirm") ? (
                <p className="text-xs text-rose-700">{fieldError(state, "confirm")}</p>
              ) : null}

              <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
                {pending
                  ? "Saving…"
                  : mode === "grant"
                    ? "Grant Premium"
                    : mode === "extend"
                      ? "Extend Premium"
                      : "Revoke Premium"}
              </button>

              {state.message ? (
                <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-rose-700"}>
                  {state.message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
