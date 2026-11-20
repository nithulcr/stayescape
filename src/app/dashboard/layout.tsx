import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireUser();
  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
