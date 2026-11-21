import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("review-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Review Policy",
  description: legalDocument?.description ?? "Stay Escape review standards",
};

export default function ReviewPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
