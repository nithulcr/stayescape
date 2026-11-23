import Image from "next/image";
import { Quote } from "lucide-react";
import { media } from "@/lib/media";
import { Reveal } from "@/components/ui/reveal";

const testimonials = [
  {
    quote:
      "The listing process was refreshingly simple. Our homestay looked beautiful and the enquiries we received were genuinely interested guests.",
    name: "Ananya Menon",
    place: "Homestay owner, Wayanad",
    avatar: media.avatarTwo,
  },
  {
    quote:
      "We wanted a platform that felt as considered as our property. STAYESCAPE gave us that premium presentation without a steep learning curve.",
    name: "Rahul Thomas",
    place: "Villa owner, Alappuzha",
    avatar: media.avatarOne,
  },
  {
    quote:
      "Approval was quick, the dashboard is clean, and the enquiry inbox makes it easy to keep every conversation organised.",
    name: "Meera Joshi",
    place: "Resort manager, Munnar",
    avatar: media.avatarThree,
  },
];

export function Testimonials() {
  return (
    <section className="section-space bg-ivory">
      <div className="site-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">Owner stories</p>
          <h2 className="section-title mt-3">Trusted by independent hosts.</h2>
        </div>
        <div className="mobile-card-slider mt-10 gap-6 lg:grid lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.07}>
              <figure className="surface-card flex h-full flex-col p-7">
                <Quote size={26} className="text-gold/70" />
                <blockquote className="mt-4 flex-1 text-sm text-charcoal/80">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-forest/10 pt-5">
                  <Image
                    src={item.avatar}
                    alt=""
                    width={42}
                    height={42}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-forest-deep">{item.name}</span>
                    <span className="block text-xs text-muted">{item.place}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
