import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("user-terms");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "User Terms",
  description: legalDocument?.description ?? "Stay Escape user terms",
};

export default function UserTermsPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
