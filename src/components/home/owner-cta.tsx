import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function OwnerCta() {
  return (
    <section id="owner-cta" className="section-space bg-ivory pt-0">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-2xl bg-forest-deep px-7 py-12 text-white md:px-14 md:py-16">
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.8fr] lg:items-center">
            <div>
             
              <h2 className="display-title mt-4 text-[clamp(2rem,4.5vw,2.9rem)]">
                Your property deserves a beautiful listing.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                Join STAYESCAPE as a property owner, publish your first listing free and upgrade only when you need more room to grow.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/register?role=owner" className="btn-primary !bg-gold  hover:!bg-[#d8b87f]">
                List for free <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-secondary !border-ivory/30 !bg-transparent !text-white hover:!bg-ivory/10">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
