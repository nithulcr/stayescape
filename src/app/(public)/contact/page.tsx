import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/legal/contact-form";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { createPageMetadata } from "@/lib/seo/metadata";

const legalDocument = getLegalDocument("contact");

export const metadata: Metadata = createPageMetadata({
  title: legalDocument?.title ?? "Contact",
  description: legalDocument?.description ?? "Contact Stay Escape support",
  path: "/contact",
});

export default function ContactPage() {
  if (!legalDocument) notFound();
  return (
    <LegalPageLayout document={legalDocument}>
      <ContactForm />
    </LegalPageLayout>
  );
}
