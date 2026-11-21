import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("cancellation-refund-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Cancellation and Refund Policy",
  description: legalDocument?.description ?? "Stay Escape cancellation and refund information",
};

export default function CancellationRefundPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
