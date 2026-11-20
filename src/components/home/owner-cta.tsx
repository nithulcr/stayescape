import Link from "next/link";
import { ArrowRight, Gem } from "lucide-react";

export function OwnerCta() {
  return (
    <section id="owner-cta" className="section-space bg-ivory pt-0">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-2xl bg-forest-deep px-7 py-12 text-ivory md:px-14 md:py-16">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-gold/20" />
          <div className="absolute -bottom-28 right-24 h-80 w-80 rounded-full border border-ivory/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Gem size={26} className="text-gold" />
              <h2 className="display-title mt-4 text-[clamp(2rem,4.5vw,3.2rem)]">
                Your property deserves a beautiful listing.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/70 md:text-base">
                Join STAYSCAPE as a property owner, publish your first listing free and upgrade only when you need more room to grow.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/register?role=owner" className="btn-primary !bg-gold !text-forest-deep hover:!bg-[#d8b87f]">
                List for free <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-secondary !border-ivory/30 !bg-transparent !text-ivory hover:!bg-ivory/10">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
