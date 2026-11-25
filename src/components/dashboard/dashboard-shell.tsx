"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const name = profile?.full_name ?? "Account";
  const roleLabel =
    profile?.role === "super_admin"
      ? "Super admin"
      : profile?.role === "admin"
        ? "Administrator"
        : "Property owner";

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => element.getClientRects().length > 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !sidebarRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !sidebarRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    const initialFocus =
      sidebarRef.current?.querySelector<HTMLElement>('[aria-label="Close menu"]') ??
      getFocusable()[0];
    initialFocus?.focus();

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [sidebarOpen]);

  const sidebarCard =
    profile?.role === "super_admin" ? (
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
          onClick={() => setSidebarOpen(false)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-soft hover:text-white"
        >
          View plans <ArrowUpRight size={12} />
        </Link>
      </div>
    );

  const signOutForm = (
    <form action={logoutAction} className="mt-6 px-3">
      <button
        type="submit"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
      >
        <LogOut size={16} /> Sign out
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-sand/30">
      <aside className="fixed top-0 z-40 hidden h-full w-[240px] bg-forest-deep md:block lg:min-h-screen">
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
          {sidebarCard}
          {signOutForm}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-forest-deep/60"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            ref={sidebarRef}
            id="dashboard-mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="relative flex h-full w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-forest-deep shadow-2xl"
          >
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-ivory/10 px-5">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5"
                aria-label={`${brand.name} home`}
              >
                <Image
                  src="/logo-white.png"
                  alt="logo"
                  width={300}
                  height={70}
                  className="h-[50px] w-fit object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-ivory/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <DashboardNav onNavigate={() => setSidebarOpen(false)} />
              {sidebarCard}
              {signOutForm}
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 md:pl-[240px]">
        <header className="flex h-20 items-center justify-between border-b border-forest/10 bg-ivory px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-mobile-sidebar"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-forest/15 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate font-heading text-xs font-semibold uppercase text-forest-deep sm:text-sm">
                STAYESCAPE owner workspace
              </p>
              <p className="mt-1 truncate text-sm text-forest-deep">
                {name} <span className="text-muted">· {roleLabel}</span>
              </p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !px-3 !py-2"
          >
            <span className="hidden sm:inline">View site</span>
            <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className="px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
