import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { logoutAction } from "@/app/auth/actions";
import { brand } from "@/lib/config";
import type { ProfileRow } from "@/types/database.types";

export function DashboardShell({
  profile,
  children,
}: {
  profile: ProfileRow | null;
  children: ReactNode;
}) {
  const name = profile?.full_name ?? "Account";
  const roleLabel =
    profile?.role === "super_admin"
      ? "Super admin"
      : profile?.role === "admin"
        ? "Administrator"
        : "Property owner";

  return (
    <div className="min-h-screen bg-sand/30">
      <aside className="fixed top-0 hidden h-full w-[240px] bg-forest-deep md:block lg:min-h-screen">
        <div className="flex h-20 items-center border-b border-ivory/10 px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${brand.name} home`}
          >
            <Image
              src="/logo-white.png"
              alt="logo"
              width={300}
              height={70}
              className="h-[65px] w-fit object-contain"
            />
          </Link>
        </div>
        <div className="p-5">
          <DashboardNav />
          {profile?.role === "super_admin" ? (
            <div className="mt-6 rounded-xl border border-ivory/10 bg-ivory/5 p-4 text-white">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gold-soft">Super Admin</p>
              <p className="mt-1.5 text-xs text-white/70">
                All features are enabled by your administrator role.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-ivory/10 bg-ivory/5 p-4 text-white">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gold-soft">Need more room?</p>
              <p className="mt-1.5 text-xs text-white/70">
                Premium owners can list up to three properties.
              </p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-soft hover:text-white"
              >
                View plans <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
          <form action={logoutAction} className="mt-6 px-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
            >
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 md:pl-[240px]">
        <header className="flex h-20 items-center justify-between border-b border-forest/10 bg-ivory px-5 lg:px-10">
          <div>
            <p className="font-heading text-sm font-semibold uppercase text-forest-deep">
              STAYESCAPE owner workspace
            </p>
            <p className="mt-1 text-sm text-forest-deep">
              {name} <span className="text-muted">· {roleLabel}</span>
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-2"
          >
            View site <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className="px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
