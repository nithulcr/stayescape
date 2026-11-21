import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("terms-and-conditions");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Terms and Conditions",
  description: legalDocument?.description ?? "Stay Escape terms and conditions",
};

export default function TermsAndConditionsPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
