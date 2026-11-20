"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Crown, Inbox, LayoutDashboard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "My properties", icon: Building2 },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/dashboard/subscription", label: "Subscription", icon: Crown },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1" aria-label="Dashboard navigation">
      {links.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-forest text-ivory"
                : "text-charcoal/70 hover:bg-forest/5 hover:text-forest",
            )}
          >
            <link.icon size={16} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
