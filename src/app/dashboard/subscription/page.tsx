import { AlertTriangle, CheckCircle2, Crown } from "lucide-react";
import { WhatsAppCheckoutButton } from "@/components/payments/whatsapp-checkout-button";
import { PropertyPublicationControls } from "@/components/dashboard/property-publication";
import { ManualSubscriptionRequestsSection } from "@/components/dashboard/manual-subscription-requests";
import { StatusPill } from "@/components/ui/status-pill";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerManualRequests } from "@/lib/data/manual-requests";
import { getOwnerPayments, getOwnerProperties, getOwnerSubscription } from "@/lib/data/owner";
import { fallbackPropertyImage } from "@/lib/media";
import { BILLING_CYCLES, getBillingCycleLabel, getPlanPriceForBillingCycle } from "@/lib/plans/billing-cycle";
import { getPlanContextForUser, getPlanLimits } from "@/lib/plans/limits";
import { formatDate, formatINR } from "@/lib/utils";
import { needsPropertySelectionForOwner } from "@/lib/subscriptions/expiry";

export default async function SubscriptionPage() {
  const { user } = await requireOwner();
  const [plan, payments, manualRequests, planLimits, properties, subscription] = await Promise.all([
    getPlanContextForUser(user.id),
    getOwnerPayments(user.id),
    getOwnerManualRequests(user.id),
    getPlanLimits(),
    getOwnerProperties(user.id),
    getOwnerSubscription(user.id),
  ]);
  const verifiedPayment = Boolean(
    plan.subscriptionId &&
      (payments.some(
        (item) => item.status === "success" && item.subscription_id === plan.subscriptionId,
      ) ||
        manualRequests.some(
          (item) => item.status === "approved" && item.approved_subscription_id === plan.subscriptionId,
        )),
  );
  const approvedPropertyCount = properties.filter(
    (property) => property.status === "approved",
  ).length;
  const needsPropertySelection = needsPropertySelectionForOwner({
    isUnlimited: plan.isUnlimited,
    isPremium: plan.isPremium,
    propertyCount: properties.length,
    publishedLimit: plan.publishedLimit,
  });
  const publicationProperties = properties.map((property) => ({
    id: property.id,
    name: property.name,
    coverImage: property.cover_image || fallbackPropertyImage,
    location:
      [property.district, property.city, property.state].filter(Boolean).join(", ") ||
      "Location pending",
    status: property.status,
    isPublished: property.is_published,
    publishAfterRenewal: property.publish_after_renewal,
    canSelect: true,
  }));
  const activeSubscription = plan.subscriptionId === subscription?.id ? subscription : null;
  const lifecycleExpiresAt = plan.expiresAt ?? subscription?.expires_at ?? null;
  const lifecycleStartsAt =
    activeSubscription?.starts_at ??
    (plan.entitlement !== "admin_bypass" ? subscription?.starts_at : null);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Subscription</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Manage your plan.</h1>

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
            Premium features are paused. Nothing was deleted: all {properties.length} of your
            properties, their photos, enquiries, and reviews are still in your account. Only one
            approved property can stay publicly visible on the Free plan.
          </p>
          <p className="mt-1 text-xs">
            Currently {plan.publishedCount} of {plan.publishedLimit} allowed properties are
            published. {approvedPropertyCount} approved properties are eligible to be selected.
          </p>
          {needsPropertySelection ? (
            <PropertyPublicationControls
              properties={publicationProperties}
              needsSelection
              showPublishControls={false}
            />
          ) : (
            <p className="mt-2 text-xs">
              Your visible listings are already within the Free plan limit. Upgrade at any time to
              restore the remaining eligible properties.
            </p>
          )}
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
            <p className="mt-1 text-xs text-muted">
              {properties.length} properties owned · {approvedPropertyCount} approved ·{" "}
              {plan.isUnlimited ? "Unlimited" : plan.limits.maxProperties} currently allowed
            </p>
            {lifecycleStartsAt && plan.entitlement !== "admin_bypass" ? (
              <p className="mt-1 text-xs text-muted">Plan started {formatDate(lifecycleStartsAt)}</p>
            ) : null}
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
        {lifecycleExpiresAt && plan.entitlement !== "admin_bypass" && (
          <p className="mt-4 text-sm text-muted">
            {plan.isExpired ? "Expired on" : "Valid until"} {formatDate(lifecycleExpiresAt)}
            {plan.isPremium && plan.daysRemaining !== null ? ` · ${plan.daysRemaining} days remaining` : ""}
          </p>
        )}
        {plan.entitlement !== "admin_bypass" && (
          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold text-forest-deep">
              {plan.isPremium ? "Renew or extend Premium" : "Upgrade to Premium"}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {BILLING_CYCLES.map((billingCycle) => (
                <div key={billingCycle} className="rounded-lg border border-forest/10 p-3">
                  <p className="text-sm font-semibold text-forest-deep">
                    {getBillingCycleLabel(billingCycle)} · {formatINR(getPlanPriceForBillingCycle(planLimits.premium, billingCycle))}
                  </p>
                  <p className="mt-1 text-xs text-muted">Pay by bank transfer or UPI, then submit your transaction details.</p>
                  <div className="mt-3">
                    <WhatsAppCheckoutButton billingCycle={billingCycle} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <ManualSubscriptionRequestsSection requests={manualRequests} />

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
