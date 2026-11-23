import Link from "next/link";
import { ArrowUpRight, Camera, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import { brand, districtOptions } from "@/lib/config";

const linkGroups = [
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-and-conditions", label: "Terms & Conditions" },
      { href: "/user-terms", label: "User Terms" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/grievance-redressal", label: "Grievance Redressal" },
    ],
  },
  {
    title: "Property owners",
    links: [
      { href: "/owner-terms", label: "Owner Terms" },
      { href: "/subscription-policy", label: "Subscription Policy" },
      { href: "/listing-policy", label: "Listing Policy" },
      { href: "/pricing", label: "Pricing" },
      { href: "/list-your-property", label: "List your property" },
    ],
  },
  {
    title: "Trust & security",
    links: [
      { href: "/cookie-policy", label: "Cookie Policy" },
      { href: "/review-policy", label: "Review Policy" },
      { href: "/cancellation-refund-policy", label: "Cancellation & Refund" },
      { href: "/acceptable-use-policy", label: "Acceptable Use" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/account-deletion", label: "Account Deletion" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-white">
      <div className="site-container grid gap-6 md:gap-12 pt-14 lg:pt-20 pb-8 lg:pb-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] ">
        <div className="max-w-sm">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label={`${brand.name} home`}
            >
              <Image
                src="/logo-white.png"
                alt={brand.name}
                width="300"
                height="70"
                className="object-contain items-start w-fit h-[70px]"
              />
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/65">
            {brand.description}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gold">
            {brand.tagline}
          </p>
          <div className="mt-6 flex items-center gap-4 text-white/60">
            <a href={`mailto:${brand.email}`} aria-label="Email">
              <Mail size={17} />
            </a>
            <Link href="/properties" aria-label="Gallery">
              <Camera size={17} />
            </Link>
            <Link href="/properties" aria-label="Messages">
              <MessageCircle size={17} />
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg  text-gold">Discover</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li>
              <Link href="/properties" className="hover:text-white">
                All stays
              </Link>
            </li>
            <li>
              <Link href="/destinations" className="hover:text-white">
                Destinations
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-white">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/list-your-property" className="hover:text-white">
                List your property
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg  text-gold ">Account</h3>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li>
              <Link href="/login" className="hover:text-white">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Create account
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white">
                Owner dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-white">
                Admin
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg  text-gold">Popular districts</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-white/70">
            {districtOptions.map((district) => (
              <Link
                key={district.slug}
                href={`/properties?district=${district.slug}`}
                className="inline-flex items-center gap-1 hover:text-white"
              >
                {district.name} <ArrowUpRight size={11} />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white/3">
        <div className="site-container grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2  text-gold">
                {group.title}
              </h4>
              <ul className="space-y-2 text-sm text-white/55">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                   
                  </li>
                  
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-black/10">
        <div className="site-container flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p>Built By Terrah Tech</p>
        </div>
      </div>
    </footer>
  );
}
