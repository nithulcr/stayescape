import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/legal/contact-form";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";

const legalDocument = getLegalDocument("contact");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Contact",
  description: legalDocument?.description ?? "Contact Stay Escape support",
};

export default function ContactPage() {
  if (!legalDocument) notFound();
  return (
    <LegalPageLayout document={legalDocument}>
      <ContactForm />
    </LegalPageLayout>
  );
}
