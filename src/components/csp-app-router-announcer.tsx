"use client";

import { useEffect, useRef, useState } from "react";

export function AppRouterAnnouncer({ tree }: { tree: unknown }) {
  const [announcement, setAnnouncement] = useState("");
  const previousTitle = useRef<string | undefined>(undefined);

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
