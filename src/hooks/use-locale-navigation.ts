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
    language,
    pathname,
    routePath,
    localize,
    switchLanguage,
  };
}
