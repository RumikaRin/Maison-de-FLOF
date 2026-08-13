"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCALE_COOKIE, type Locale } from "@/lib/locale";

export type Language = Locale;

function persistLocaleCookie(language: Language) {
  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "vi", // Default language is Vietnamese
      setLanguage: (lang) => {
        persistLocaleCookie(lang);
        set({ language: lang });
      },
      toggleLanguage: () =>
        set((state) => {
          const language = state.language === "vi" ? "en" : "vi";
          persistLocaleCookie(language);
          return { language };
        }),
    }),
    {
      name: "sonvn-language", // LocalStorage key
    }
  )
);
