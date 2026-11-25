import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("acceptable-use-policy");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Acceptable Use Policy",
  description: legalDocument?.description ?? "Stay Escape acceptable use rules",
  path: "/acceptable-use-policy",
});

export default function AcceptableUsePolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
