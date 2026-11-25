import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("privacy-policy");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Privacy Policy",
  description: legalDocument?.description ?? "Stay Escape privacy information",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
