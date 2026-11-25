import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { media } from "@/lib/media";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-forest-deep lg:block">
          <Image src={media.heroPortrait} alt="Premium stay exterior" fill priority sizes="50vw" className="object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/60 to-forest-deep/20" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div className="[&_span]:!text-white">
              <Logo />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-soft">STAYESCAPE</p>
              <h2 className="display-title mt-4 max-w-md text-4xl">Discover. Stay. Experience.</h2>
              <p className="mt-4 max-w-md text-sm text-white/65">
                A calmer way to find distinctive stays and manage your own place in Kerala.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-ivory px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </div>
      </div>
    </SmoothScrollProvider>
  );
}
