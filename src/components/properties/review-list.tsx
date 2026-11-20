"use client";

import { useMemo, useState } from "react";
import { MessageSquareText, PenLine, Star } from "lucide-react";
import { ReviewForm } from "@/components/properties/review-form";
import { formatDate } from "@/lib/utils";
import type { PropertyReview } from "@/types";

const sortLabels = {
  recent: "Most recent",
  highest: "Highest rated",
  lowest: "Lowest rated",
} as const;

type SortKey = keyof typeof sortLabels;

export function ReviewList({
  propertyId,
  reviews,
  currentUserId,
  guestToken,
  canReview,
  openComposer = false,
}: {
  propertyId: string;
  reviews: PropertyReview[];
  currentUserId?: string | null;
  guestToken?: string | null;
  canReview: boolean;
  openComposer?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [writing, setWriting] = useState(openComposer);
  const [successMessage, setSuccessMessage] = useState("");
  const [notice, setNotice] = useState("");

  const ownReview = reviews.find(
    (review) =>
      (Boolean(currentUserId) && review.user_id === currentUserId) ||
      (Boolean(guestToken) && review.guest_token === guestToken),
  );
  const summary = useMemo(() => {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : null,
      count: reviews.length,
    };
  }, [reviews]);

  const visible = useMemo(() => {
    const items = reviews.filter(
      (review) => review.status === "approved" || review.user_id === currentUserId,
    );
    return items.sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating;
      if (sort === "lowest") return a.rating - b.rating;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [reviews, currentUserId, sort]);

  function openReviewForm() {
    setSuccessMessage("");
    setNotice("");
    if (!canReview) {
      setNotice("You cannot review your own property listing.");
      setWriting(false);
      return;
    }
    setWriting(true);
  }

  return (
    <section id="reviews" className="mt-12 scroll-mt-24 border-t border-forest/10 pt-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Guest stories</p>
          <h2 className="section-title mt-3 !text-2xl">Reviews & ratings.</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-forest-deep">
              <Star size={16} fill="currentColor" className="text-gold" />
              {summary.average ? summary.average.toFixed(1) : "New"}
            </span>
            <span>{summary.count} review{summary.count === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="input-field !w-auto !py-2 text-xs"
            >
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <option key={key} value={key}>{sortLabels[key]}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={openReviewForm} className="btn-secondary">
            <PenLine size={14} /> Write a review
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {successMessage}
        </div>
      )}

      {notice && (
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          {notice}
        </div>
      )}

      {writing && canReview && (
        <div className="mt-6">
          <ReviewForm
            key={ownReview?.id ?? "new-review"}
            propertyId={propertyId}
            existing={ownReview}
            onCancel={() => setWriting(false)}
            onSubmitted={(message) => {
              setSuccessMessage(message);
              setWriting(false);
            }}
          />
        </div>
      )}

      {visible.length ? (
        <div className="mt-6 grid gap-4">
          {visible.map((review) => (
            <article key={review.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-forest-deep">{review.author_label}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(review.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {review.status !== "approved" && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-800">
                      Pending moderation
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: review.rating }, (_, index) => (
                      <Star key={index} size={13} fill="currentColor" />
                    ))}
                  </span>
                </div>
              </div>
              {review.title && (
                <h3 className="mt-3 font-serif text-base text-forest-deep">{review.title}</h3>
              )}
              {review.comment && (
                <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{review.comment}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 surface-card px-6 py-12 text-center">
          <MessageSquareText className="mx-auto text-forest/30" size={28} />
          <p className="mt-3 text-sm text-muted">
            No reviews yet. Be the first to share your experience.
          </p>
          <button type="button" onClick={openReviewForm} className="btn-secondary mt-5">
            <PenLine size={14} /> Write the first review
          </button>
        </div>
      )}
    </section>
  );
}
