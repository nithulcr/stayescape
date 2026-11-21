import Link from "next/link";
import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { LegalSection } from "@/components/legal/legal-section";
import { LegalTableOfContents } from "@/components/legal/legal-table-of-contents";
import { brand } from "@/lib/config";
import type { LegalDocument } from "@/content/legal-types";

export function LegalPageLayout({
  document,
  children,
}: {
  document: LegalDocument;
  children?: ReactNode;
}) {
  return (
    <div className="site-container section-space">
      <header className="mx-auto max-w-3xl">
        <p className="eyebrow">{document.eyebrow}</p>
        <h1 className="display-title mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">{document.title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted md:text-base">{document.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.12em] text-muted">
          <span>Last updated: {document.lastUpdated}</span>
          <span>Version {document.version}</span>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,700px)_minmax(0,1fr)] lg:items-start">
        <LegalTableOfContents document={document} />
        <div className="min-w-0">
          <div className="surface-card p-6 md:p-9">
            <p className="text-sm leading-relaxed text-charcoal/75 md:text-base">{document.intro}</p>
            <div className="mt-9 space-y-9">
              {document.sections.map((section) => (
                <LegalSection key={section.id} section={section} />
              ))}
            </div>
            {children}
            <section className="mt-10 border-t border-forest/10 pt-8">
              <h2 className="font-serif text-2xl text-forest-deep">Contact and related policies</h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/75 md:text-base">
                For questions about this document, use the contact page or email the placeholder support address below. Replace this address with the official Stay Escape contact before launch.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-forest-deep">
                  <Mail size={15} /> {brand.email}
                </a>
                {document.related.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm font-semibold text-forest underline decoration-gold/60 underline-offset-4 hover:text-forest-deep">
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
