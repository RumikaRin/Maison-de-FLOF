import type { Locale } from "./locale";

export function shouldPersistLocaleCookie(input: {
  requestHadLocalePrefix: boolean;
  currentCookie: string | null | undefined;
  resolvedLocale: Locale;
}) {
  return (
    !input.requestHadLocalePrefix &&
    input.currentCookie !== input.resolvedLocale
  );
}
