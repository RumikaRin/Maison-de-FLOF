export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "flof-locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

export function stripLocalePrefix(pathname: string): {
  locale: Locale | null;
  pathname: string;
  hadPrefix: boolean;
} {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [firstSegment] = normalized.slice(1).split("/");
  if (!isLocale(firstSegment)) {
    return { locale: null, pathname: normalized, hadPrefix: false };
  }

  const stripped = normalized.slice(firstSegment.length + 1);
  return {
    locale: firstSegment,
    pathname: stripped || "/",
    hadPrefix: true,
  };
}

export function isLocaleExcludedPath(pathname: string) {
  return (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    /\.[a-z0-9]{2,8}$/i.test(pathname)
  );
}

export function localizedPath(pathname: string, locale: Locale) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const { pathname: unprefixed } = stripLocalePrefix(normalized);
  if (isLocaleExcludedPath(unprefixed)) return unprefixed;
  return unprefixed === "/" ? `/${locale}` : `/${locale}${unprefixed}`;
}

export function getClientLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const val = match ? decodeURIComponent(match[1]) : null;
  return isLocale(val) ? val : null;
}

export function resolveLocale({
  pathname,
  cookie,
}: {
  pathname: string;
  cookie?: string | null;
}): Locale {
  const explicit = stripLocalePrefix(pathname).locale;
  if (explicit) return explicit;

  if (typeof window !== "undefined") {
    const windowExplicit = stripLocalePrefix(window.location.pathname).locale;
    if (windowExplicit) return windowExplicit;
  }

  const effectiveCookie = cookie !== undefined ? cookie : getClientLocaleCookie();
  return isLocale(effectiveCookie) ? effectiveCookie : DEFAULT_LOCALE;
}

export function unsupportedLocalePrefix(pathname: string) {
  const [firstSegment] = pathname.replace(/^\/+/, "").split("/");
  return /^[a-z]{2}$/i.test(firstSegment) && !isLocale(firstSegment.toLowerCase())
    ? firstSegment
    : null;
}
