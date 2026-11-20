"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: { offset: -88 },
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      stopInertiaOnNavigate: true,
    });

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
