import { CheckCircle2, Crown } from "lucide-react";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { StatusPill } from "@/components/ui/status-pill";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerPayments, getOwnerSubscription } from "@/lib/data/owner";
import { getPlanContextForUser } from "@/lib/plans/limits";
import { formatDate, formatINR } from "@/lib/utils";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const { user } = await requireOwner();
  const [plan, subscription, payments] = await Promise.all([
    getPlanContextForUser(user.id),
    getOwnerSubscription(user.id),
    getOwnerPayments(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Subscription</p>
      <h1 className="display-title mt-3 text-4xl">Manage your plan.</h1>

      {plan.entitlement === "admin_bypass" && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest-deep px-4 py-3 text-sm text-white">
          <CheckCircle2 size={16} /> All features are enabled by your administrator role. No subscription is required.
        </p>
      )}
      {payment === "success" && plan.entitlement !== "admin_bypass" && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} /> Payment verified and Premium activated.
        </p>
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
          </div>
          {plan.entitlement === "admin_bypass" ? (
            <StatusPill status="super_admin">Unlimited access</StatusPill>
          ) : (
            <StatusPill status={subscription?.status ?? "free"} />
          )}
        </div>
        {subscription?.expires_at && plan.entitlement !== "admin_bypass" && (
          <p className="mt-4 text-sm text-muted">Renews / expires on {formatDate(subscription.expires_at)}</p>
        )}
        {!plan.isPremium && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <CheckoutButton billingCycle="monthly" label="Upgrade monthly" />
            <CheckoutButton billingCycle="yearly" label="Upgrade yearly" />
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
                    {item.billing_cycle} · {formatDate(item.created_at)}
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
