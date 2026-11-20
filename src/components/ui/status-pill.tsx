import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/database.types";

const styles: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  new: "bg-amber-50 text-amber-800 ring-amber-200",
  replied: "bg-sky-50 text-sky-800 ring-sky-200",
  contacted: "bg-sky-50 text-sky-800 ring-sky-200",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  suspended: "bg-rose-50 text-rose-800 ring-rose-200",
  expired: "bg-stone-100 text-stone-700 ring-stone-200",
  draft: "bg-stone-100 text-stone-700 ring-stone-200",
  free: "bg-stone-100 text-stone-700 ring-stone-200",
  premium: "bg-[#f4ead7] text-[#8a6a30] ring-[#e4d3b3]",
  user: "bg-stone-100 text-stone-700 ring-stone-200",
  owner: "bg-forest/10 text-forest-deep ring-forest/20",
  admin: "bg-[#e4d3b3] text-[#6b4f1d] ring-[#c5a46d]",
  super_admin: "bg-[#f4ead7] text-[#8a6a30] ring-[#c5a46d]",
};

export function StatusPill({
  status,
  className,
  children,
}: {
  status: string | PropertyStatus;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-semibold capitalize ring-1 ring-inset",
        styles[status] ?? "bg-stone-100 text-stone-700 ring-stone-200",
        className,
      )}
    >
      {children ?? status}
    </span>
  );
}
