"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import { AdminNav } from "@/components/admin/admin-nav";
import { logoutAction } from "@/app/auth/actions";
import { brand } from "@/lib/config";

export function AdminShell({
  children,
  role = "admin",
}: {
  children: ReactNode;
  role?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const roleLabel = role === "super_admin" ? "Super admin" : "Administrator";

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
              width="300"
              height="70"
              className="object-contain items-start w-fit h-[50px] md:h-[65px]"
            />
          </Link>
        </div>
        <div className="p-5">
          <AdminNav />
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
            id="admin-mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
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
              <AdminNav onNavigate={() => setSidebarOpen(false)} />
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
              aria-controls="admin-mobile-sidebar"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-forest/15 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-forest-deep font-heading uppercase sm:text-sm">
                STAYESCAPE administration
              </p>
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-muted">
                {roleLabel}
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
