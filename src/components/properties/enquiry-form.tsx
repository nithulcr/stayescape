"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { submitEnquiryAction } from "@/app/actions/enquiry";
import type { ActionResult } from "@/types";

function SubmitButton({ priceOnRequest }: { priceOnRequest: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      <Send size={15} /> {pending ? "Sending..." : priceOnRequest ? "Request quote" : "Send enquiry"}
    </button>
  );
}

export function EnquiryForm({
  propertyId,
  propertyName,
  priceOnRequest = false,
}: {
  propertyId: string;
  propertyName: string;
  priceOnRequest?: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(submitEnquiryAction, {
    ok: false,
    message: "",
  });

  if (state.ok) {
    return (
      <div className="surface-card p-6">
        <h3 className="font-serif text-xl text-forest-deep">Enquiry sent.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="surface-card grid gap-4 p-6">
      <input type="hidden" name="property_id" value={propertyId} />
      <div className="mb-1">
        <h3 className="font-serif text-xl text-forest-deep">
          {priceOnRequest ? "Request a quote" : "Enquire about this stay"}
        </h3>
        <p className="mt-1 text-xs text-muted">{propertyName}</p>
      </div>
      <label>
        <span className="field-label">Your name</span>
        <input name="name" required minLength={2} className="input-field" autoComplete="name" />
        {state.fieldErrors?.name && <span className="field-error">{state.fieldErrors.name[0]}</span>}
      </label>
      <label>
        <span className="field-label">Email address</span>
        <input name="email" type="email" required className="input-field" autoComplete="email" />
        {state.fieldErrors?.email && <span className="field-error">{state.fieldErrors.email[0]}</span>}
      </label>
      <label>
        <span className="field-label">Phone (optional)</span>
        <input name="phone" className="input-field" autoComplete="tel" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="field-label">Check-in</span>
          <input name="check_in" type="date" className="input-field" />
          {state.fieldErrors?.check_in && <span className="field-error">{state.fieldErrors.check_in[0]}</span>}
        </label>
        <label>
          <span className="field-label">Check-out</span>
          <input name="check_out" type="date" className="input-field" />
          {state.fieldErrors?.check_out && <span className="field-error">{state.fieldErrors.check_out[0]}</span>}
        </label>
      </div>
      <label>
        <span className="field-label">Guests (optional)</span>
        <input name="guests" type="number" min={1} max={50} className="input-field" placeholder="2" />
        {state.fieldErrors?.guests && <span className="field-error">{state.fieldErrors.guests[0]}</span>}
      </label>
      <label>
        <span className="field-label">Message</span>
        <textarea
          name="message"
          required
          minLength={10}
          rows={4}
          className="input-field"
          placeholder={priceOnRequest ? "Tell the owner about your dates and request a quote." : "Tell the owner about your dates and what you are looking for."}
        />
        {state.fieldErrors?.message && <span className="field-error">{state.fieldErrors.message[0]}</span>}
      </label>
      {state.message && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.message}</p>}
      <SubmitButton priceOnRequest={priceOnRequest} />
      <p className="text-center text-[0.7rem] leading-relaxed text-muted">
        Your details are shared only with the property owner for this enquiry.
      </p>
    </form>
  );
}
