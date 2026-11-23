"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { requestAccountDeletionAction } from "@/app/actions/account-deletion";
import type { ActionResult } from "@/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60">
      <TriangleAlert size={16} /> {pending ? "Submitting..." : "Request account deletion"}
    </button>
  );
}

export function AccountDeletionForm({ email }: { email: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(requestAccountDeletionAction, {
    ok: false,
    message: "",
  });

  return (
    <form action={formAction} className="surface-card mt-8 grid gap-4 p-6 md:p-8">
      <div>
        <h2 className="font-serif text-xl text-forest-deep">Confirm deletion request</h2>
        <p className="mt-1 text-xs text-muted">
          This action signs you out and starts the deletion workflow. Type DELETE exactly to confirm.
        </p>
      </div>
      <label>
        <span className="field-label">Account email</span>
        <input name="email" type="email" required defaultValue={email} className="input-field" autoComplete="email" />
        {state.fieldErrors?.email && <span className="field-error">{state.fieldErrors.email[0]}</span>}
      </label>
      <label>
        <span className="field-label">Reason (optional)</span>
        <textarea name="reason" rows={3} maxLength={500} className="input-field" />
      </label>
      <label>
        <span className="field-label">Type DELETE to confirm</span>
        <input name="confirmation" required className="input-field" placeholder="DELETE" />
        {state.fieldErrors?.confirmation && <span className="field-error">{state.fieldErrors.confirmation[0]}</span>}
      </label>
      {state.message && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
