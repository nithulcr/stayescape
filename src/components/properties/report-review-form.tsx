"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Flag } from "lucide-react";
import { submitReviewReportAction } from "@/app/actions/review-reports";
import type { ActionResult } from "@/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-60">
      <Flag size={13} /> {pending ? "Sending..." : "Submit report"}
    </button>
  );
}

export function ReportReviewForm({ reviewId, guestToken }: { reviewId: string; guestToken?: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult, FormData>(submitReviewReportAction, {
    ok: false,
    message: "",
  });

  if (state.ok) {
    return <p className="text-xs text-emerald-700" role="status">{state.message}</p>;
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-semibold text-muted hover:text-rose-700">
        {open ? "Cancel report" : "Report review"}
      </button>
      {open && (
        <form action={formAction} className="mt-3 grid gap-3 rounded-lg border border-forest/10 bg-ivory/60 p-3">
          <input type="hidden" name="review_id" value={reviewId} />
          {guestToken && <input type="hidden" name="guest_token" value={guestToken} />}
          <label>
            <span className="field-label">Reason</span>
            <select name="reason" required defaultValue="spam" className="input-field !py-2 text-xs">
              <option value="spam">Spam</option>
              <option value="abuse">Abuse or harassment</option>
              <option value="fake">Fake or incentivised review</option>
              <option value="irrelevant">Irrelevant content</option>
              <option value="private-information">Private information</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            <span className="field-label">Details (optional)</span>
            <textarea name="details" rows={2} maxLength={2000} className="input-field text-xs" />
          </label>
          {state.message && <p className="text-xs text-rose-700">{state.message}</p>}
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
