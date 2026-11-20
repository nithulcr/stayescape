import Link from "next/link";
import { ArrowUpRight, Camera, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import { brand } from "@/lib/config";
import { getDestinations } from "@/lib/data/public";

export async function SiteFooter() {
  const destinations = await getDestinations();

  return (
    <footer className="bg-forest-deep text-white">
      <div className="site-container grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
        <div className="max-w-sm">
          <div>
           <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
      <Image src="/logo-white.png" alt={brand.name} width="300" height="70" className="object-contain items-start w-fit h-[70px]" />    
    </Link>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white/65">{brand.description}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gold">{brand.tagline}</p>
        </div>

        <div>
          <h3 className="mb-4 text-lg  text-gold">Discover</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/properties" className="hover:text-white">All stays</Link></li>
            <li><Link href="/destinations" className="hover:text-white">Destinations</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/list-your-property" className="hover:text-white">List your property</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg  text-gold ">Account</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
            <li><Link href="/register" className="hover:text-white">Create account</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Owner dashboard</Link></li>
            <li><Link href="/admin" className="hover:text-white">Admin</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg  text-gold">Popular destinations</h3>
          {destinations.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-white/70">
              {destinations.map((destination) => (
                <Link key={destination.id} href={`/destinations/${destination.slug}`} className="inline-flex items-center gap-1 hover:text-white">
                  {destination.name} <ArrowUpRight size={11} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">Destinations appear here once connected.</p>
          )}
          <div className="mt-6 flex items-center gap-4 text-white/60">
            <a href={`mailto:${brand.email}`} aria-label="Email"><Mail size={17} /></a>
            <Link href="/properties" aria-label="Gallery"><Camera size={17} /></Link>
            <Link href="/properties" aria-label="Messages"><MessageCircle size={17} /></Link>
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="site-container flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
