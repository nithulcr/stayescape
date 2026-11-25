import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("subscription-policy");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Subscription Policy",
  description: legalDocument?.description ?? "Stay Escape subscription information",
  path: "/subscription-policy",
});

export default function SubscriptionPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
