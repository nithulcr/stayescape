import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("disclaimer");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Disclaimer",
  description: legalDocument?.description ?? "Stay Escape disclaimer",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
