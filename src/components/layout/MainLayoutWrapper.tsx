/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome) · design-system: design.md · designed-as-app */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/locale";
import { getMobileSurfacePolicy } from "@/lib/mobile-surface-policy";
import { cn } from "@/lib/utils";

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
  const policy = getMobileSurfacePolicy(routePath);
  const isAdmin = policy.mode === "admin";
  const isHomepage = routePath === "/";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <main
      data-mobile-mode={policy.mode}
      className={cn(
        "flex-grow",
        isAdmin && !isHomepage
          ? "pt-0"
          : [
              "pt-24",
              policy.bottomNavigation
                ? "pb-mobile-navigation md:pb-fl-xl"
                : policy.contextualAction !== "none"
                  ? "pb-mobile-action md:pb-fl-xl"
                  : "pb-fl-2xl md:pb-fl-xl",
            ],
      )}
    >
      {children}
    </main>
  );
}
