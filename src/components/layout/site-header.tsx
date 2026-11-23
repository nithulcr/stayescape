"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { getBrowserClient } from "@/lib/supabase/client";
import { logoutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Explore Stays" },
  { href: "/destinations", label: "Destinations" },
  { href: "/list-your-property", label: "List Your Property" },
];

type HeaderUser = { id: string; role: string; name: string } | null;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser>(null);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;

    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      setUser({
        id: data.user.id,
        role: profile?.role ?? "user",
        name: profile?.full_name ?? data.user.email?.split("@")[0] ?? "Account",
      });
    };
    void load();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-forest/10 bg-ivory/95 backdrop-blur-md">
      <div className="site-container flex h-[75px] md:h-[85px] items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label={`${user ? user.name : "STAYESCAPE"} home`}
        >
          <Image
            src="/logo2.png"
            width="300"
            height="70"
            alt={user ? user.name : "STAYESCAPE"}
            className="object-contain items-start w-fit h-[50px] md:h-[65px]"
          />
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex h-full "
          aria-label="Primary navigation"
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-2 text-[.95rem] font-[400] text-charcoal/75 transition-colors hover:text-forest h-full items-center flex",
                  active && "text-forest",
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[0px] h-[.09rem] bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="btn-secondary !px-4 !py-2"
              >
                {isAdmin ? (
                  <ShieldCheck size={15} />
                ) : (
                  <LayoutDashboard size={15} />
                )}
                {isAdmin ? "Admin" : "Dashboard"}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center btn-primary gap-1.5 !px-4 !py-2"
                >
                  <LogOut size={14} /> Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 text-sm font-medium btn-primary text-forest hover:text-forest-soft"
              >
                Login
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-forest/15 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-forest/10 bg-ivory lg:hidden">
          <div className="site-container flex flex-col py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-forest/8 py-3 text-sm font-medium text-forest"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 grid gap-3">
              {user ? (
                <>
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    onClick={closeMenu}
                    className="btn-primary"
                  >
                    {isAdmin ? "Admin dashboard" : "Owner dashboard"}
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className="btn-secondary w-full">
                      <LogOut size={15} /> Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="btn-secondary"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="btn-primary"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
