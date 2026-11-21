import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("privacy-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Privacy Policy",
  description: legalDocument?.description ?? "Stay Escape privacy information",
};

export default function PrivacyPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
