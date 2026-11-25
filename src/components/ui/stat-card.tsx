import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <Icon size={17} className="text-gold" />
      </div>
      <p className="mt-3 font-serif text-2xl text-3xl text-forest-deep">{value}</p>
      {hint && <p className="mt-1 text-[10px] md:text-xs text-muted">{hint}</p>}
    </div>
  );
}
