import Link from "next/link";
import { ArrowUpRight, Camera, Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { brand } from "@/lib/config";
import { getDestinations } from "@/lib/data/public";

export async function SiteFooter() {
  const destinations = await getDestinations();

  return (
    <footer className="bg-forest-deep text-ivory">
      <div className="site-container grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
        <div className="max-w-sm">
          <div className="[&_span]:!text-ivory">
            <Logo />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ivory/65">{brand.description}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gold">{brand.tagline}</p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Discover</h3>
          <ul className="space-y-2.5 text-sm text-ivory/70">
            <li><Link href="/properties" className="hover:text-ivory">All stays</Link></li>
            <li><Link href="/destinations" className="hover:text-ivory">Destinations</Link></li>
            <li><Link href="/pricing" className="hover:text-ivory">Pricing</Link></li>
            <li><Link href="/list-your-property" className="hover:text-ivory">List your property</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Account</h3>
          <ul className="space-y-2.5 text-sm text-ivory/70">
            <li><Link href="/login" className="hover:text-ivory">Sign in</Link></li>
            <li><Link href="/register" className="hover:text-ivory">Create account</Link></li>
            <li><Link href="/dashboard" className="hover:text-ivory">Owner dashboard</Link></li>
            <li><Link href="/admin" className="hover:text-ivory">Admin</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Popular destinations</h3>
          {destinations.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ivory/70">
              {destinations.slice(0, 8).map((destination) => (
                <Link key={destination.id} href={`/destinations/${destination.slug}`} className="inline-flex items-center gap-1 hover:text-ivory">
                  {destination.name} <ArrowUpRight size={11} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ivory/50">Destinations appear here once connected.</p>
          )}
          <div className="mt-6 flex items-center gap-4 text-ivory/60">
            <a href={`mailto:${brand.email}`} aria-label="Email"><Mail size={17} /></a>
            <Link href="/properties" aria-label="Gallery"><Camera size={17} /></Link>
            <Link href="/properties" aria-label="Messages"><MessageCircle size={17} /></Link>
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="site-container flex flex-col gap-2 py-5 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
