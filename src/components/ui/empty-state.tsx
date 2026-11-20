import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2eee4] text-forest">
        {icon ?? <MapPin size={20} />}
      </div>
      <h3 className="font-serif text-xl text-forest-deep">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-xl border border-[#e4d3b3] bg-[#fbf7ee] px-5 py-4 text-sm text-[#6c5730]">
      <strong className="font-semibold">Demo mode.</strong> Add Supabase environment variables to
      load live properties, destinations and accounts. See the README for exact setup steps.
    </div>
  );
}
