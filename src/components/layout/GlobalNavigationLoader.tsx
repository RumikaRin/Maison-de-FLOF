"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SiteLoadingScreen } from "@/components/layout/SiteLoadingScreen";

const MINIMUM_VISIBLE_TIME = 300;
const MAXIMUM_VISIBLE_TIME = 8000;

export function GlobalNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [visible, setVisible] = useState(false);
  const startedAt = useRef(0);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRoute = useRef(routeKey);

  useEffect(() => {
    if (previousRoute.current === routeKey) return;
    previousRoute.current = routeKey;

    const elapsed = Date.now() - startedAt.current;
    const hideTimer = setTimeout(() => setVisible(false), Math.max(0, MINIMUM_VISIBLE_TIME - elapsed));
    return () => clearTimeout(hideTimer);
  }, [routeKey]);

  useEffect(() => {
    const startLoading = () => {
      startedAt.current = Date.now();
      setVisible(true);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      fallbackTimer.current = setTimeout(() => setVisible(false), MAXIMUM_VISIBLE_TIME);
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.href === window.location.href) return;

      startLoading();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", startLoading);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", startLoading);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []);

  return <SiteLoadingScreen visible={visible} />;
}
