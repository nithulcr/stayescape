import Link from "next/link";
import { brand } from "@/lib/config";
import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  const imageClassName = compact
    ? "object-contain items-start w-fit h-[40px] md:h-[50px]"
    : "object-contain items-start w-fit h-[50px] md:h-[65px]";

  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
      <Image src="/logo2.png" alt={brand.name} width="300" height="70" className={imageClassName} />
    </Link>
  );
}
