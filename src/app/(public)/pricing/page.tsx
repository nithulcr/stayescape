import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { FALLBACK_FREE_LIMITS, FALLBACK_PREMIUM_LIMITS, getPlans, toPlanLimits } from "@/lib/plans/limits";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent plans for property owners on STAYSCAPE.",
};

export default async function PricingPage() {
  const plans = await getPlans();
  const free = toPlanLimits(plans.find((plan) => plan.code === "free") ?? null, FALLBACK_FREE_LIMITS);
  const premium = toPlanLimits(plans.find((plan) => plan.code === "premium") ?? null, FALLBACK_PREMIUM_LIMITS);

  return (
    <div className="site-container py-12 md:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="display-title mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">Start free. Grow when you are ready.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          No setup fee. No listing fee. Upgrade only when you need more properties and richer presentation.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
        <div className="surface-card flex flex-col p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Starter</p>
          <h2 className="mt-2 font-serif text-3xl text-forest-deep">{free.planName}</h2>
          <p className="mt-2 text-sm text-muted">For owners testing the platform with one property.</p>
          <p className="mt-6 font-serif text-4xl text-forest-deep">
            Free <span className="text-sm font-sans text-muted">forever</span>
          </p>
          <ul className="mt-7 flex-1 space-y-3 text-sm text-charcoal/75">
            {free.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-gold" /> {feature}
              </li>
            ))}
          </ul>
          <Link href="/register?role=owner" className="btn-secondary mt-8 w-full justify-center">
            Start for free
          </Link>
        </div>

        <div className="relative flex flex-col rounded-xl border border-gold/50 bg-forest-deep p-7 text-white shadow-[0_20px_60px_-30px_rgba(18,61,50,0.8)]">
          <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-forest-deep">
            <Crown size={11} /> Most popular
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-soft">Growth</p>
          <h2 className="mt-2 font-serif text-3xl">{premium.planName}</h2>
          <p className="mt-2 text-sm text-white/65">For hosts with multiple properties and bigger ambitions.</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="font-serif text-3xl">{formatINR(premium.priceMonthly)}</p>
              <p className="mt-1 text-xs text-white/55">per month</p>
            </div>
            <div>
              <p className="font-serif text-3xl">{formatINR(premium.priceYearly)}</p>
              <p className="mt-1 text-xs text-white/55">per year</p>
            </div>
          </div>
          <ul className="mt-7 flex-1 space-y-3 text-sm text-white/80">
            {premium.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-gold" /> {feature}
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="[&_button]:!border-ivory/30 [&_button]:!bg-transparent [&_button]:!text-white">
              <CheckoutButton billingCycle="monthly" label="Monthly" />
            </div>
            <CheckoutButton billingCycle="yearly" label="Yearly" />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-muted">
        Payments are processed securely by Razorpay. Subscription activation happens only after a signed payment confirmation or verified webhook.
      </div>
    </div>
  );
}
