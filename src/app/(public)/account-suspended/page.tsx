import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Account suspended",
  description: "This Stay Escape account is temporarily suspended.",
};

export default function AccountSuspendedPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="surface-card w-full p-8 text-center">
        <ShieldAlert className="mx-auto text-rose-600" size={36} />
        <h1 className="display-title mt-5 text-3xl">Account suspended</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This account is temporarily suspended. If you believe this is a mistake, contact us from the email address associated with your account.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">Contact support</Link>
          <Link href="/" className="btn-secondary">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
