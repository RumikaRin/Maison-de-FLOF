/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome) · design-system: design.md · designed-as-app */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/locale";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";

/**
 * design.md § Motion allows exactly two primitives: a hero media load fade and
 * a state crossfade. The scroll-triggered entrance observer that used to run
 * here was a third, and § Notes lists a reveal animation on every section as an
 * anti-pattern — so it is gone.
 *
 * What survives is the single permitted page-load fade on the homepage, now
 * opacity-only (no `y` translate) at --fl-dur-base / --fl-ease-out.
 */
export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The raw pathname carries the locale (`/vi/admin`, `/vi`), so strip it before
  // matching — otherwise admin routes get public padding and the homepage
  // never matches its own path.
  const routePath = stripLocalePrefix(pathname || "/").pathname;
  const isAdmin = routePath.startsWith("/admin");
  const isHomepage = routePath === "/";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  if (!isHomepage) {
    return <main className={isAdmin ? "flex-grow pt-0" : "flex-grow pt-24 pb-20"}>{children}</main>;
  }

  return (
    <AnimatePresence mode="wait">
      <safeMotion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="flex-grow pt-24 pb-20"
      >
        {children}
      </safeMotion.main>
    </AnimatePresence>
  );
}
