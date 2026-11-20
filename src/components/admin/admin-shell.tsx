import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { logoutAction } from "@/app/auth/actions";

export function AdminShell({
  children,
  role = "admin",
}: {
  children: ReactNode;
  role?: string;
}) {
  const roleLabel = role === "super_admin" ? "Super admin" : "Administrator";
  return (
    <div className="min-h-screen bg-sand/30 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-forest-deep lg:min-h-screen">
        <div className="flex h-20 items-center border-b border-ivory/10 px-6">
          <div className="[&_span]:!text-ivory"><Logo /></div>
        </div>
        <div className="p-5">
          <p className="mb-3 flex items-center gap-2 px-3 text-[0.65rem] uppercase tracking-[0.18em] text-gold-soft">
            <ShieldCheck size={13} /> Admin console
          </p>
          <AdminNav />
          <form action={logoutAction} className="mt-6 px-3">
            <button type="submit" className="inline-flex items-center gap-2 text-xs text-ivory/60 hover:text-ivory">
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-forest/10 bg-ivory px-5 lg:px-10">
          <div>
            <p className="text-sm font-semibold text-forest-deep">STAYSCAPE administration</p>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">{roleLabel}</p>
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
