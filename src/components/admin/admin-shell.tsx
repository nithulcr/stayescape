import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";
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
  const roleLabel = role === "super_admin" ? "Super admin" : "Administrator";
  return (
    <div className="min-h-screen bg-sand/30  ">
      <aside className="bg-forest-deep lg:min-h-screen h-full fixed top-0 hidden md:block w-[240px]">
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
              className="object-contain items-start w-fit h-[65px]"
            />
          </Link>
        </div>
        <div className="p-5">
          {/* <p className="mb-3 flex items-center gap-2 px-3 text-[0.65rem] uppercase tracking-[0.24em] text-gold-soft">
            <ShieldCheck size={13} /> Admin console
          </p> */}
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
      <div className="min-w-0 md:pl-[240px]">
        <header className="flex h-20 items-center justify-between border-b border-forest/10 bg-ivory px-5 lg:px-10">
          <div>
            <p className="text-sm font-semibold text-forest-deep font-heading uppercase ">
              STAYESCAPE administration
            </p>
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-muted">
              {roleLabel}
            </p>
          </div>
          <Link href="/" target="__blank" className="btn-secondary !py-2">
            View site <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className="px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
