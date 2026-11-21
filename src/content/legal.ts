import { legalDocuments } from "@/content/legal-documents";
import type { LegalDocument } from "@/content/legal-types";

export function getLegalDocument(slug: string): LegalDocument | null {
  return legalDocuments[slug] ?? null;
}
