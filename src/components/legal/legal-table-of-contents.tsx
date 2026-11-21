import type { LegalDocument } from "@/content/legal-types";

export function LegalTableOfContents({ document }: { document: LegalDocument }) {
  if (!document.showTableOfContents || document.sections.length < 3) return null;

  return (
    <nav aria-label="On this page" className="surface-card p-5 lg:sticky lg:top-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">On this page</p>
      <ol className="mt-4 space-y-2.5 text-sm text-muted">
        {document.sections.map((section, index) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="flex gap-2 hover:text-forest">
              <span className="text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
              <span>{section.title.replace(/^\d+\.\s*/, "")}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
