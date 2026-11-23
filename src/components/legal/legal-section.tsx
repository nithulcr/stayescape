import type { LegalSection as LegalSectionType } from "@/content/legal-types";

export function LegalSection({ section }: { section: LegalSectionType }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-t border-forest/10 pt-8 first:border-0 first:pt-0">
      <h2 className="font-serif text-2xl text-forest-deep md:text-3xl">{section.title}</h2>
      <div className="mt-4 space-y-4 text-sm text-charcoal/75 md:text-base">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {section.bullets && section.bullets.length > 0 && (
          <ul className="list-disc space-y-2 pl-5 marker:text-gold">
            {section.bullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        )}
        {section.links && section.links.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {section.links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-semibold text-forest underline decoration-gold/60 underline-offset-4 hover:text-forest-deep">
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
