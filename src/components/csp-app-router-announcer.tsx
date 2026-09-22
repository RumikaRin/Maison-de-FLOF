"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * CSP-safe route announcer mounted in RootLayout for screen reader accessibility.
 *
 * Rendering nothing until mounted ensures identical server and initial client
 * renders to avoid hydration mismatches. When navigation occurs (detected via
 * pathname or tree change), it announces the new page title or primary heading.
 */
export function AppRouterAnnouncer({ tree }: { tree?: unknown } = {}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const previousTitle = useRef<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const currentTitle =
      document.title ||
      document.querySelector("h1")?.textContent ||
      "";
    if (
      previousTitle.current !== undefined &&
      previousTitle.current !== currentTitle
    ) {
      setAnnouncement(currentTitle);
    }
    previousTitle.current = currentTitle;
  }, [pathname, tree]);

  if (!mounted) return null;

  return (
    <div
      id="__next-route-announcer__"
      role="alert"
      aria-live="assertive"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
