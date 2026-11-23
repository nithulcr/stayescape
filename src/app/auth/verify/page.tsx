import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

export const metadata: Metadata = { title: "Email verified" };

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5">
      <div className="surface-card max-w-md p-8 text-center">
        <BadgeCheck size={34} className="mx-auto text-gold" />
        <h1 className="mt-4 font-serif text-2xl text-forest-deep">Email verified.</h1>
        <p className="mt-3 text-sm text-muted">
          Your account is ready. Sign in to continue to your dashboard.
        </p>
        <Link href="/login" className="btn-secondary mt-6 w-full justify-center">
          Sign in
        </Link>
      </div>
    </div>
  );
}
