import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("grievance-redressal");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Grievance Redressal",
  description: legalDocument?.description ?? "Stay Escape grievance process",
  path: "/grievance-redressal",
});

export default function GrievanceRedressalPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
