"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CSP-safe replacement for Next's route announcer, aliased in over
 * `next/dist/client/components/app-router-announcer` (see next.config.ts).
 *
 * Next's own announcer renders `null` on the server and only creates its live
 * region client-side, through a portal. This replacement previously rendered
 * the `<div>` unconditionally, so whenever the server bundle resolved Next's
 * original module while the client bundle resolved this one, the server HTML
 * and the first client render disagreed and React threw hydration error #418
 * on every page load.
 *
 * Rendering nothing until mounted makes the first client render identical to
 * the server output no matter which module each bundle picked up. The live
 * region only has to exist for post-navigation announcements, so deferring it
 * by one tick costs nothing.
 */
export function AppRouterAnnouncer({ tree }: { tree: unknown }) {
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
  }, [tree]);

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
