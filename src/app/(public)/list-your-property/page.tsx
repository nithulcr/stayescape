import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Check, ClipboardCheck, MessageSquare } from "lucide-react";
import { media } from "@/lib/media";
import { createPageMetadata } from "@/lib/seo/metadata";
import { Testimonials } from "@/components/home/testimonials";
import { WhyList } from "@/components/home/why-list";

export const metadata = createPageMetadata({
  title: "List your property",
  description: "Join STAYESCAPE as a property owner and reach travellers looking for distinctive Kerala stays.",
  path: "/list-your-property",
});

const steps = [
  {
    icon: ClipboardCheck,
    title: "Create your owner account",
    text: "Sign up as a property owner and verify your email address.",
  },
  {
    icon: Camera,
    title: "Add your property",
    text: "Share the essentials, upload photos and add richer details on Premium.",
  },
  {
    icon: Check,
    title: "Get reviewed",
    text: "Our team checks every listing before it becomes publicly visible.",
  },
  {
    icon: MessageSquare,
    title: "Receive enquiries",
    text: "Interested guests contact you directly through the enquiry form.",
  },
];

export default function ListYourPropertyPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-forest-deep">
        <Image src={media.heroPortrait} alt="Elegant hotel exterior" fill priority sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest-deep/75 to-transparent" />
        <div className="site-container relative grid gap-10 py-20 text-white md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow !text-gold">For property owners</p>
            <h1 className="display-title mt-4 text-[clamp(2.5rem,6vw,4.4rem)]">
              Put your property on the map.
            </h1>
            <p className="mt-5 max-w-xl text-sm text-white/75 md:text-base">
              STAYESCAPE connects independent owners with travellers who care about setting, character and thoughtful hospitality.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?role=owner" className="btn-primary !bg-gold !text-forest-deep hover:!bg-[#d8b87f]">
                Create owner account <ArrowRight size={15} />
              </Link>
              <Link href="/pricing" className="btn-secondary !border-ivory/30 !bg-transparent !text-white hover:!bg-ivory/10">
                View plans
              </Link>
            </div>
          </div>
          <div className="surface-card !bg-ivory/95 p-7 text-forest-deep">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest">Why list with us</p>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                "Premium presentation for every approved property",
                "Clear, intent-led enquiries instead of noisy messages",
                "Plan limits that scale with your portfolio",
                "Admin review that protects traveller trust",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title mt-3">Four simple steps.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="surface-card p-6">
               
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold">
                  <step.icon size={22} className=" text-forest" />
                </span>
                <h3 className="mt-3 font-serif text-lg text-forest-deep">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WhyList />
            <Testimonials />
    </>
  );
}
