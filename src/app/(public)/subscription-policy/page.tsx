import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("subscription-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Subscription Policy",
  description: legalDocument?.description ?? "Stay Escape subscription information",
};

export default function SubscriptionPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
