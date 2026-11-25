import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("owner-terms");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Owner Terms",
  description: legalDocument?.description ?? "Stay Escape owner terms",
  path: "/owner-terms",
});

export default function OwnerTermsPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
