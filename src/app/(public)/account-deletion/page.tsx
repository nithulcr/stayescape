import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountDeletionForm } from "@/components/legal/account-deletion-form";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalDocument } from "@/content/legal";
import { getAuthContext } from "@/lib/auth/guards";

const legalDocument = getLegalDocument("account-deletion");

export const metadata: Metadata = {
  title: legalDocument?.title ?? "Account Deletion",
  description: legalDocument?.description ?? "Stay Escape account deletion and data rights",
};

export default async function AccountDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  if (!legalDocument) notFound();
  const [{ deleted }, context] = await Promise.all([searchParams, getAuthContext()]);

  return (
    <LegalPageLayout document={legalDocument}>
      {deleted === "1" ? (
        <div className="surface-card mt-8 p-6" role="status">
          <h2 className="font-serif text-xl text-forest-deep">Deletion request received.</h2>
          <p className="mt-2 text-sm text-muted">
            Your profile has been anonymised and you have been signed out. We will retain only the records described above where required.
          </p>
        </div>
      ) : context ? (
        <AccountDeletionForm email={context.user.email ?? ""} />
      ) : (
        <div className="surface-card mt-8 p-6">
          <p className="text-sm text-muted">Sign in to submit an account deletion request.</p>
          <Link href="/login?next=/account-deletion" className="btn-primary mt-4">
            Sign in to continue
          </Link>
        </div>
      )}
    </LegalPageLayout>
  );
}
