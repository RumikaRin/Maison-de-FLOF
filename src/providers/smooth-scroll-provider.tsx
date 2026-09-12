"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Global reference dispatchable by other components (e.g. ScrollToTop)
let globalLenisInstance: any = null;

export function getGlobalLenis() {
  return globalLenisInstance;
}

export function scrollToTopLenis(duration = 1.2) {
  if (globalLenisInstance) {
    globalLenisInstance.scrollTo(0, { duration });
  } else if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect user's motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Do NOT run smooth scroll on admin dashboard routes
    // Dashboards require instant native scrolling for sidebars, data tables, and modals
    const isAdmin = pathname?.startsWith("/admin") || pathname?.includes("/admin");
    if (isAdmin) {
      if (globalLenisInstance) {
        globalLenisInstance.destroy();
        globalLenisInstance = null;
      }
      return;
    }

    let isDestroyed = false;
    let rafId: number;

    import("lenis").then(({ default: Lenis }) => {
      if (isDestroyed) return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        touchMultiplier: 1,
      });

      globalLenisInstance = lenis;

      function raf(time: number) {
        if (!isDestroyed) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
      }

      rafId = requestAnimationFrame(raf);
    });

    return () => {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (globalLenisInstance) {
        globalLenisInstance.destroy();
        globalLenisInstance = null;
      }
    };
  }, [pathname]);

  // Recalculate dimensions on route change
  useEffect(() => {
    if (globalLenisInstance) {
      globalLenisInstance.resize();
    }
  }, [pathname]);

  return <>{children}</>;
}
