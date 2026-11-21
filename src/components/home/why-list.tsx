import { BadgeCheck, MessageCircleHeart, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const features = [
  {
    icon: BadgeCheck,
    title: "Approved, trustworthy stays",
    text: "Every listing is reviewed by our team before it becomes visible to travellers.",
  },
  {
    icon: Sparkles,
    title: "A curated first impression",
    text: "Strong photography and clear details help your property stand out from day one.",
  },
  {
    icon: MessageCircleHeart,
    title: "Enquiries without the noise",
    text: "Guests reach you through focused enquiries, so every conversation has intent.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    text: "Manage availability details, imagery and guest communication from one clean dashboard.",
  },
];

export function WhyList() {
  return (
    <section className="section-space bg-light-ivory">
      <div className="site-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <p className="eyebrow">For property owners</p>
          <h2 className="section-title mt-3">A better way to fill your calendar.</h2>
          <p className="mt-4 max-w-lg text-sm  text-muted md:text-base">
            STAYSCAPE is built for independent owners who want a premium presence without the clutter of mass marketplaces. Start free, upgrade when you are ready.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.06}>
              <div className="surface-card bg-sand/40 h-full p-6">
                <feature.icon size={22} className="text-gold" />
                <h3 className="mt-4 font-serif text-lg text-forest-deep">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
