import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("cookie-policy");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Cookie Policy",
  description: legalDocument?.description ?? "Stay Escape cookie information",
};

export default function CookiePolicyPage() {
  if (!legalDocument) notFound();
  return <LegalPageLayout document={legalDocument} />;
}
