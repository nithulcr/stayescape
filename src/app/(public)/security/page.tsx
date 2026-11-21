import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("security");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Security",
  description: legalDocument?.description ?? "Stay Escape security practices",
};

export default function SecurityPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
