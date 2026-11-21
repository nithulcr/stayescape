"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Crown,
  Flag,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  MapPin,
  Settings2,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Crown },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/admin/review-reports", label: "Reports", icon: Flag },
  { href: "/admin/destinations", label: "Destinations", icon: MapPin },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/settings", label: "Plans & amenities", icon: Settings2 },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1" aria-label="Admin navigation">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2  transition-colors",
              active
                ? "bg-gold text-forest-deep"
                : "text-white/65 hover:bg-ivory/10 hover:text-white",
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
