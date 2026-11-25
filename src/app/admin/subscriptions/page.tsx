import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAllSubscriptions } from "@/lib/data/admin";
import { getBillingCycleLabel } from "@/lib/plans/billing-cycle";
import { formatDate } from "@/lib/utils";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAllSubscriptions();

  return (
    <>
      <p className="eyebrow">Billing</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Subscriptions.</h1>

      {subscriptions.length ? (
        <div className="surface-card mt-8 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Owner</th>
            <th className="px-5 py-3">Plan</th>
            <th className="px-5 py-3">Source</th>
            <th className="px-5 py-3">Cycle</th>

                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/8">
              {subscriptions.map((subscription) => {
                const isAdminGrant = subscription.source === "admin_grant";
                const isManual = subscription.source === "manual";
                const durationLabel = subscription.grant_duration_months
                  ? `${subscription.grant_duration_months} month${subscription.grant_duration_months === 1 ? "" : "s"}`
                  : getBillingCycleLabel(subscription.billing_cycle);
                return (
                  <tr key={subscription.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-forest-deep">{subscription.owner_name}</p>
                      <p className="mt-0.5 text-xs text-muted">{subscription.owner_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {subscription.plan_name}
                      {isAdminGrant ? <span className="ml-1 text-xs text-muted">(Admin Grant)</span> : null}
                      {isManual ? <span className="ml-1 text-xs text-muted">(Manual Payment)</span> : null}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {isAdminGrant ? "Admin Grant" : isManual ? "Manual (WhatsApp)" : "Razorpay"}
                      {isAdminGrant && subscription.grant_reason ? (
                        <p className="mt-0.5">{subscription.grant_reason}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">{durationLabel}</td>
                    <td className="px-5 py-4"><StatusPill status={subscription.status} /></td>
                    <td className="px-5 py-4 text-xs text-muted">{formatDate(subscription.expires_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8"><EmptyState title="No subscriptions yet" description="Owner subscriptions will appear here." /></div>
      )}
    </>
  );
}
