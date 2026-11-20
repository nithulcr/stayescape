import Link from "next/link";
import { brand } from "@/lib/config";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${brand.name} home`}>
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="60" height="60" rx="10" fill="#123D32" />
        <path d="M8 25.5L20 11L32 25.5" stroke="#C5A46D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 25.5H28" stroke="#F7F4EC" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 29.5H25" stroke="#F7F4EC" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.95rem] font-semibold tracking-[0.2em] text-forest">{brand.name}</span>
          <span className="mt-1 text-[0.55rem] tracking-[0.16em] text-muted uppercase">
            Discover. Stay. Experience.
          </span>
        </span>
      )}
    </Link>
  );
}
