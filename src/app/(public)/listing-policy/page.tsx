import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("listing-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Listing Policy",
  description: legalDocument?.description ?? "Stay Escape listing standards",
};

export default function ListingPolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
