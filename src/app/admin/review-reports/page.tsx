import Link from "next/link";
import { Flag } from "lucide-react";
import { resolveReviewReportAction } from "@/app/admin/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminReviewReports } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminReviewReportsPage() {
  const reports = await getAdminReviewReports();

  return (
    <>
      <p className="eyebrow">Trust & safety</p>
      <h1 className="display-title mt-3 text-4xl">Review reports.</h1>
      <p className="mt-3 text-sm text-muted">
        Reports are stored for moderation. Actioning a report rejects the associated review.
      </p>

      {reports.length ? (
        <div className="mt-8 grid gap-4">
          {reports.map((report) => (
            <article key={report.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-serif text-xl text-forest-deep">
                    <Flag size={17} className="text-rose-600" />
                    {report.reason.replace("-", " ")}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Reported {formatDate(report.created_at)} · Status: {report.status}
                  </p>
                </div>
                {report.property && (
                  <Link href={`/properties/${report.property.slug}#reviews`} className="text-sm font-semibold text-forest">
                    {report.property.name}
                  </Link>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-ivory/70 p-4">
                {report.review ? (
                  <>
                    <p className="text-xs font-semibold text-forest-deep">
                      {report.review.reviewer_name ?? "Former guest"} · {report.review.rating}/5 · {report.review.status}
                    </p>
                    {report.review.title && <p className="mt-1 text-sm font-medium">{report.review.title}</p>}
                    {report.review.comment && <p className="mt-1 text-sm text-charcoal/75">{report.review.comment}</p>}
                  </>
                ) : (
                  <p className="text-xs text-muted">The reported review is no longer available.</p>
                )}
              </div>

              {report.details && <p className="mt-3 text-sm text-charcoal/70">{report.details}</p>}

              {report.status === "open" ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-forest/10 pt-4">
                  <form action={resolveReviewReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="decision" value="dismissed" />
                    <button type="submit" className="btn-secondary !px-3 !py-1.5">Dismiss</button>
                  </form>
                  <form action={resolveReviewReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="decision" value="actioned" />
                    <button type="submit" className="btn-secondary !px-3 !py-1.5 !text-rose-700">
                      Action & reject review
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-5 border-t border-forest/10 pt-4 text-xs text-muted">
                  {report.reviewed_at ? `Resolved ${formatDate(report.reviewed_at)}` : "Resolved"}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No reports found" description="Guest and user reports will appear here." />
        </div>
      )}
    </>
  );
}
