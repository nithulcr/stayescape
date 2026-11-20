"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Trash2 } from "lucide-react";
import {
  deleteReviewAction,
  submitReviewAction,
  updateReviewAction,
} from "@/app/actions/reviews";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { getOrCreateGuestReviewId } from "@/lib/reviews/guest";
import { cn } from "@/lib/utils";
import type { ActionResult, PropertyReview } from "@/types";

const ratingLabels = ["Poor", "Fair", "Good", "Excellent", "Outstanding"];

export function ReviewForm({
  propertyId,
  existing,
  onCancel,
  onSubmitted,
}: {
  propertyId: string;
  existing?: PropertyReview | null;
  onCancel?: () => void;
  onSubmitted?: (message: string) => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const submittedRef = useRef(false);
  const action = existing ? updateReviewAction : submitReviewAction;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, {
    ok: false,
    message: "",
  });
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const guestTokenRef = useRef("");
  const activeRating = hoverRating || rating;

  useEffect(() => {
    guestTokenRef.current = getOrCreateGuestReviewId();
  }, []);

  function syncGuestToken(event: FormEvent<HTMLFormElement>) {
    const input = event.currentTarget.elements.namedItem("guest_token") as HTMLInputElement | null;
    if (input) input.value = guestTokenRef.current || getOrCreateGuestReviewId();
  }

  useEffect(() => {
    if (!state.ok || submittedRef.current) return;
    submittedRef.current = true;
    formRef.current?.reset();
    setRating(0);
    setHoverRating(0);
    onSubmitted?.(state.message);
    router.refresh();
  }, [state.ok, state.message, onSubmitted, router]);

  return (
    <div className="surface-card p-6">
      <div>
        <h3 className="font-serif text-xl text-forest-deep">
          {existing ? "Edit your review" : "Share your experience"}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {existing
            ? "Updated reviews are published again after admin moderation."
            : "Your review is published after a quick admin moderation check."}
        </p>
      </div>

      <form ref={formRef} action={formAction} onSubmit={syncGuestToken} className="mt-5 grid gap-4">
        <input type="hidden" name="property_id" value={propertyId} />
        <input type="hidden" name="guest_token" defaultValue="" />
        {existing && <input type="hidden" name="review_id" value={existing.id} />}

        <div>
          <span className="field-label">Your rating</span>
          <div
            className="mt-2 flex flex-wrap items-center gap-2"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className="cursor-pointer"
                title={ratingLabels[value - 1]}
                onMouseEnter={() => setHoverRating(value)}
                onFocus={() => setHoverRating(value)}
                onBlur={() => setHoverRating(0)}
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  required
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <Star
                  size={28}
                  className={cn(
                    "transition-all duration-150",
                    value <= activeRating ? "scale-110 text-gold" : "text-forest/20",
                  )}
                  fill={value <= activeRating ? "currentColor" : "none"}
                />
                <span className="sr-only">{value} star{value === 1 ? "" : "s"}</span>
              </label>
            ))}
            {activeRating > 0 && (
              <span className="ml-1 text-xs text-muted">{ratingLabels[activeRating - 1]}</span>
            )}
          </div>
          {state.fieldErrors?.rating && <span className="field-error">{state.fieldErrors.rating[0]}</span>}
        </div>

        <label>
          <span className="field-label">
            Review title <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
          </span>
          <input
            name="title"
            maxLength={120}
            defaultValue={existing?.title ?? ""}
            placeholder="Sum up your stay"
            className="input-field"
          />
          {state.fieldErrors?.title && <span className="field-error">{state.fieldErrors.title[0]}</span>}
        </label>

        <label>
          <span className="field-label">Review description</span>
          <textarea
            name="comment"
            required
            minLength={10}
            maxLength={1500}
            rows={5}
            defaultValue={existing?.comment ?? ""}
            placeholder="What did you enjoy about this stay?"
            className="input-field"
          />
          {state.fieldErrors?.comment && <span className="field-error">{state.fieldErrors.comment[0]}</span>}
        </label>

        {state.message && (!state.ok || !onSubmitted) && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-xs",
              state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700",
            )}
          >
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="btn-primary w-fit disabled:opacity-60">
            {pending && <Loader2 size={15} className="animate-spin" />}
            {existing ? "Submit updated review" : "Submit review"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary !px-4 !py-2">
              Cancel
            </button>
          )}
        </div>
      </form>

      {existing && (
        <form action={deleteReviewAction} onSubmit={syncGuestToken} className="mt-4">
          <input type="hidden" name="review_id" value={existing.id} />
          <input type="hidden" name="guest_token" defaultValue="" />
          <ConfirmSubmitButton
            message="Delete your review? This cannot be undone."
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700"
          >
            <Trash2 size={13} /> Delete review
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
