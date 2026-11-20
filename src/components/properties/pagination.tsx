import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (nextPage: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
      else search.set(key, value);
    }
    search.set("page", String(nextPage));
    return `/properties?${search.toString()}`;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className="btn-secondary !px-3 !py-2">
          <ChevronLeft size={15} /> Previous
        </Link>
      )}
      <span className="px-3 text-sm text-muted">
        Page <strong className="text-forest-deep">{page}</strong> of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={href(page + 1)} className="btn-secondary !px-3 !py-2">
          Next <ChevronRight size={15} />
        </Link>
      )}
    </nav>
  );
}
