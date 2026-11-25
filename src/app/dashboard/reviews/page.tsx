import Link from "next/link";
import { Star } from "lucide-react";
import { deleteOwnerReviewAction, moderateOwnerReviewAction } from "@/app/dashboard/reviews/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerReviews } from "@/lib/data/owner";
import { cn, formatDate } from "@/lib/utils";

const filters = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

export default async function OwnerReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user } = await requireOwner();
  const { status } = await searchParams;
  const reviews = await getOwnerReviews(user.id);
  const active = filters.some((filter) => filter.key === status) ? status : "all";
  const visible = active === "all" ? reviews : reviews.filter((review) => review.status === active);
  const pendingCount = reviews.filter((review) => review.status === "pending").length;

  return (
    <>
      <p className="eyebrow">Guest feedback</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Reviews.</h1>
      <p className="mt-3 text-sm text-muted">
        {pendingCount
          ? `${pendingCount} review${pendingCount === 1 ? "" : "s"} awaiting your approval.`
          : "All reviews are up to date."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === "all" ? "/dashboard/reviews" : `/dashboard/reviews?status=${filter.key}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active === filter.key
                ? "bg-forest text-white"
                : "bg-sand/60 text-forest hover:bg-sand",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {visible.length ? (
        <div className="mt-8 grid gap-4">
          {visible.map((review) => (
            <article key={review.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-xl text-forest-deep">{review.property_name}</h2>
                    <StatusPill status={review.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {review.reviewer_name} · {formatDate(review.created_at)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star key={index} size={14} fill="currentColor" />
                  ))}
                </span>
              </div>

              {review.title && (
                <h3 className="mt-4 font-serif text-lg text-forest-deep">{review.title}</h3>
              )}
              {review.comment && (
                <p className="mt-3 whitespace-pre-line text-sm text-charcoal/75">{review.comment}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-forest/10 pt-4">
                <Link
                  href={`/properties/${review.property_slug}#reviews`}
                  className="text-sm font-semibold text-forest"
                >
                  View property
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={moderateOwnerReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="btn-secondary !px-3 !py-1.5">Approve</button>
                  </form>
                  <form action={moderateOwnerReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className="btn-secondary !px-3 !py-1.5">Reject</button>
                  </form>
                  <form action={deleteOwnerReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <ConfirmSubmitButton
                      message="Delete this review?"
                      className="text-xs text-rose-600 hover:text-rose-700"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No reviews found" description="Guest reviews for your properties will appear here." />
        </div>
      )}
    </>
  );
}
