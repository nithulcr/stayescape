"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { submitContactMessageAction } from "@/app/actions/contact";
import type { ActionResult } from "@/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      <Send size={15} /> {pending ? "Sending..." : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(submitContactMessageAction, {
    ok: false,
    message: "",
  });

  if (state.ok) {
    return (
      <div className="surface-card mt-8 p-6" role="status">
        <h2 className="font-serif text-xl text-forest-deep">Message received.</h2>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="surface-card mt-8 grid gap-4 p-6 md:p-8">
      <div>
        <h2 className="font-serif text-xl text-forest-deep">Send us a message</h2>
        <p className="mt-1 text-xs text-muted">Use this form for general support, privacy or listing questions.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Your name</span>
          <input name="name" required minLength={2} autoComplete="name" className="input-field" />
          {state.fieldErrors?.name && <span className="field-error">{state.fieldErrors.name[0]}</span>}
        </label>
        <label>
          <span className="field-label">Email address</span>
          <input name="email" type="email" required autoComplete="email" className="input-field" />
          {state.fieldErrors?.email && <span className="field-error">{state.fieldErrors.email[0]}</span>}
        </label>
      </div>
      <label>
        <span className="field-label">Subject (optional)</span>
        <input name="subject" className="input-field" />
      </label>
      <label>
        <span className="field-label">Message</span>
        <textarea name="message" required minLength={10} rows={5} className="input-field" />
        {state.fieldErrors?.message && <span className="field-error">{state.fieldErrors.message[0]}</span>}
      </label>
      {state.message && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
