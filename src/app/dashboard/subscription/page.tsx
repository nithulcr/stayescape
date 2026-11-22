import Link from "next/link";
import { AlertTriangle, CheckCircle2, Crown } from "lucide-react";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { StatusPill } from "@/components/ui/status-pill";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerPayments } from "@/lib/data/owner";
import { BILLING_CYCLES, getBillingCycleLabel, getPlanPriceForBillingCycle } from "@/lib/plans/billing-cycle";
import { getPlanContextForUser, getPlanLimits } from "@/lib/plans/limits";
import { formatDate, formatINR } from "@/lib/utils";

export default async function SubscriptionPage() {
  const { user } = await requireOwner();
  const [plan, payments, planLimits] = await Promise.all([
    getPlanContextForUser(user.id),
    getOwnerPayments(user.id),
    getPlanLimits(),
  ]);
  const verifiedPayment = Boolean(
    plan.subscriptionId &&
      payments.some(
        (item) => item.status === "success" && item.subscription_id === plan.subscriptionId,
      ),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Subscription</p>
      <h1 className="display-title mt-3 text-4xl">Manage your plan.</h1>

      {plan.entitlement === "admin_bypass" && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest-deep px-4 py-3 text-sm text-white">
          <CheckCircle2 size={16} /> All features are enabled by your administrator role. No subscription is required.
        </p>
      )}
      {verifiedPayment && plan.entitlement === "paid" && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} /> Payment verified and Premium activated.
        </p>
      )}
      {plan.status === "expired" && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} /> Your Premium plan has expired.
          </p>
          <p className="mt-1 text-xs">
            Premium features are paused. {plan.publishedCount} of your approved properties are
            published; the plan limit is {plan.publishedLimit}.
          </p>
          {plan.needsPropertySelection ? (
            <Link href="/dashboard/properties" className="mt-2 inline-block text-xs font-semibold underline">
              Choose which property stays published
            </Link>
          ) : null}
        </div>
      )}

      <section className="surface-card mt-8 p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">
              {plan.entitlement === "admin_bypass" ? "Current access" : "Current plan"}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-forest-deep">{plan.limits.planName}</h2>
            <p className="mt-2 text-sm text-muted">
              {plan.isUnlimited
                ? "Unlimited properties · Unlimited images per property"
                : `${plan.limits.maxProperties} properties · ${plan.limits.maxImagesPerProperty} images per property`}
            </p>
            {plan.entitlement !== "admin_bypass" && (
              <p className="mt-1 text-xs text-muted">
                {plan.publishedCount} of {plan.publishedLimit} approved properties published.
              </p>
            )}
          </div>
          {plan.entitlement === "admin_bypass" ? (
            <StatusPill status="super_admin">Unlimited access</StatusPill>
          ) : (
            <StatusPill status={plan.status} />
          )}
        </div>
        {plan.expiresAt && plan.entitlement !== "admin_bypass" && (
          <p className="mt-4 text-sm text-muted">
            {plan.isExpired ? "Expired on" : "Valid until"} {formatDate(plan.expiresAt)}
            {plan.isPremium && plan.daysRemaining !== null ? ` · ${plan.daysRemaining} days remaining` : ""}
          </p>
        )}
        {!plan.isPremium && (
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {BILLING_CYCLES.map((billingCycle) => (
              <CheckoutButton
                key={billingCycle}
                billingCycle={billingCycle}
                label={`${getBillingCycleLabel(billingCycle)} · ${formatINR(getPlanPriceForBillingCycle(planLimits.premium, billingCycle))}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-forest/10 px-6 py-4">
          <Crown size={16} className="text-gold" />
          <h2 className="font-serif text-xl text-forest-deep">Payment history</h2>
        </div>
        {payments.length ? (
          <div className="divide-y divide-forest/8">
            {payments.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                <div>
                  <p className="font-medium text-forest-deep">{formatINR(item.amount / 100)}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {getBillingCycleLabel(item.billing_cycle)} · {formatDate(item.created_at)}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-muted">
            {plan.entitlement === "admin_bypass"
              ? "Administrator access does not require a payment record."
              : "No payments recorded yet."}
          </p>
        )}
      </section>
    </div>
  );
}
