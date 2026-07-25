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

export function resolveLocale({
  pathname,
  cookie,
}: {
  pathname: string;
  cookie?: string | null;
}): Locale {
  const explicit = stripLocalePrefix(pathname).locale;
  if (explicit) return explicit;
  return isLocale(cookie) ? cookie : DEFAULT_LOCALE;
}

export function unsupportedLocalePrefix(pathname: string) {
  const [firstSegment] = pathname.replace(/^\/+/, "").split("/");
  return /^[a-z]{2}$/i.test(firstSegment) && !isLocale(firstSegment.toLowerCase())
    ? firstSegment
    : null;
}
