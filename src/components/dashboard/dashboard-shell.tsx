import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { logoutAction } from "@/app/auth/actions";
import type { ProfileRow } from "@/types/database.types";

export function DashboardShell({
  profile,
  children,
}: {
  profile: ProfileRow | null;
  children: ReactNode;
}) {
  const name = profile?.full_name ?? "Account";

  return (
    <div className="min-h-screen bg-sand/30 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-forest/10 bg-ivory lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="site-container flex h-20 items-center justify-between lg:px-6">
          <Logo />
        </div>
        <div className="site-container pb-5 lg:px-6">
          <DashboardNav />
          {profile?.role === "super_admin" ? (
            <div className="mt-6 rounded-xl bg-forest-deep p-4 text-white">
              <p className="text-[0.65rem] uppercase tracking-wider text-gold-soft">Super Admin</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                All features are enabled by your administrator role.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-forest-deep p-4 text-white">
              <p className="text-[0.65rem] uppercase tracking-wider text-gold-soft">Need more room?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                Premium owners can list up to three properties.
              </p>
              <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-soft">
                View plans <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
          <form action={logoutAction} className="mt-5">
            <button type="submit" className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-forest">
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-forest/10 bg-ivory px-5 lg:px-10">
          <div>
            <p className="text-sm font-semibold text-forest font-heading uppercase ">Owner workspace</p>
            <p className="mt-1 text-sm  text-forest-deep">{name}</p>
          </div>
          <Link href="/" className="btn-secondary !py-2">
            View site <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className="px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
