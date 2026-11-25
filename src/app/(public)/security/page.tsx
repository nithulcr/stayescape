import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("security");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Security",
  description: legalDocument?.description ?? "Stay Escape security practices",
  path: "/security",
});

export default function SecurityPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
