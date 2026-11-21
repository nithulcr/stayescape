import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("acceptable-use-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Acceptable Use Policy",
  description: legalDocument?.description ?? "Stay Escape acceptable use rules",
};

export default function AcceptableUsePolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
