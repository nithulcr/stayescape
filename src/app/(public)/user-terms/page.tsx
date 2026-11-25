import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("user-terms");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "User Terms",
  description: legalDocument?.description ?? "Stay Escape user terms",
  path: "/user-terms",
});

export default function UserTermsPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
