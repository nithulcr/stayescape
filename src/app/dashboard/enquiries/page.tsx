import Link from "next/link";
import { CalendarDays, Mail, Phone, Users } from "lucide-react";
import { respondToEnquiryAction } from "@/app/dashboard/properties/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerEnquiries } from "@/lib/data/owner";
import { formatDate, formatINR } from "@/lib/utils";

export default async function DashboardEnquiriesPage() {
  const { user } = await requireOwner();
  const enquiries = await getOwnerEnquiries(user.id);

  return (
    <>
      <p className="eyebrow">Inbox</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Guest enquiries.</h1>
      <p className="mt-3 text-sm text-muted">Enquiries are visible only to the owner of the related property.</p>

      {enquiries.length ? (
        <div className="mt-8 grid gap-4">
          {enquiries.map((enquiry) => (
            <article key={enquiry.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-xl text-forest-deep">{enquiry.name}</h2>
                    <StatusPill status={enquiry.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {enquiry.property_name} · {formatDate(enquiry.created_at)}
                  </p>
                </div>
                <Link href={`/properties/${enquiry.property_slug}`} className="text-sm font-semibold text-forest">
                  View property
                </Link>
              </div>
              {(enquiry.check_in || enquiry.check_out || enquiry.guests) && (
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                  {enquiry.check_in && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} /> In {formatDate(enquiry.check_in)}
                    </span>
                  )}
                  {enquiry.check_out && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} /> Out {formatDate(enquiry.check_out)}
                    </span>
                  )}
                  {enquiry.guests && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} /> {enquiry.guests} guest{enquiry.guests === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              )}
              <p className="mt-4 whitespace-pre-line text-sm text-charcoal/75">{enquiry.message}</p>
              <div className="mt-5 flex flex-wrap gap-4 border-t border-forest/10 pt-4 text-xs text-muted">
                <a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1.5 hover:text-forest">
                  <Mail size={13} /> {enquiry.email}
                </a>
                {enquiry.phone && (
                  <a href={`tel:${enquiry.phone}`} className="inline-flex items-center gap-1.5 hover:text-forest">
                    <Phone size={13} /> {enquiry.phone}
                  </a>
                )}
              </div>

              {(enquiry.response_message || enquiry.quoted_amount !== null) && (
                <div className="mt-4 rounded-lg bg-sand/50 p-4 text-xs text-charcoal/75">
                  {enquiry.response_message && <p className="whitespace-pre-line">{enquiry.response_message}</p>}
                  {enquiry.quoted_amount !== null && (
                    <p className="mt-2 font-semibold text-forest-deep">
                      Quote: {formatINR(enquiry.quoted_amount)} {enquiry.quote_currency}
                    </p>
                  )}
                </div>
              )}

              <form action={respondToEnquiryAction} className="mt-5 grid gap-3 border-t border-forest/10 pt-5 sm:grid-cols-2">
                <input type="hidden" name="enquiry_id" value={enquiry.id} />
                <input type="hidden" name="quote_currency" value="INR" />
                <label className="text-xs text-muted">
                  Status
                  <select name="status" defaultValue={enquiry.status} className="input-field mt-1.5 text-xs">
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="contacted">Contacted</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className="text-xs text-muted">
                  Quote amount (INR)
                  <input
                    name="quoted_amount"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={enquiry.quoted_amount ?? ""}
                    placeholder="Optional"
                    className="input-field mt-1.5 text-xs"
                  />
                </label>
                <label className="text-xs text-muted sm:col-span-2">
                  Response to guest
                  <textarea
                    name="response_message"
                    rows={3}
                    maxLength={2000}
                    defaultValue={enquiry.response_message ?? ""}
                    placeholder="Write a reply or quote for the guest."
                    className="input-field mt-1.5 text-xs"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn-secondary !px-3 !py-1.5">Save response</button>
                </div>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No enquiries yet"
            description="When travellers enquire about your published properties, they will appear here."
            actionLabel="Browse your properties"
            actionHref="/dashboard/properties"
          />
        </div>
      )}
    </>
  );
}
