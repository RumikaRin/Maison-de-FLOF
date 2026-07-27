"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  localizedPath,
  resolveLocale,
  stripLocalePrefix,
  type Locale,
} from "@/lib/locale";
import { useLanguageStore } from "@/store/language-store";

export function useLocaleNavigation() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { language, setLanguage } = useLanguageStore();
  const routePath = stripLocalePrefix(pathname).pathname;
  const urlLocale = resolveLocale({ pathname });

  useEffect(() => {
    if (language !== urlLocale) setLanguage(urlLocale);
    document.documentElement.lang = urlLocale;
  }, [language, setLanguage, urlLocale]);

  const localize = useCallback(
    (target: string, locale: Locale = urlLocale) =>
      localizedPath(target, locale),
    [urlLocale],
  );

  const switchLanguage = useCallback(() => {
    const nextLocale: Locale = urlLocale === "vi" ? "en" : "vi";
    setLanguage(nextLocale);
    const suffix =
      typeof window === "undefined"
        ? ""
        : `${window.location.search}${window.location.hash}`;
    router.push(`${localizedPath(pathname, nextLocale)}${suffix}`);
  }, [pathname, router, setLanguage, urlLocale]);

  return {
    // The URL is the authoritative locale, not the store. Middleware redirects
    // every request to a locale-prefixed path, so `urlLocale` is known during
    // SSR; the store only settles after hydration. Returning the store value
    // here rendered Vietnamese labels into the server HTML for `/en` and threw
    // React hydration error #418 on every page load.
    language: urlLocale,
    /** The persisted preference. Only useful for the toggle's own state. */
    storedLanguage: language,
    pathname,
    routePath,
    localize,
    switchLanguage,
  };
}
