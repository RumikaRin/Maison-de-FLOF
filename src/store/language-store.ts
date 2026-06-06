"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "vi" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "vi", // Default language is Vietnamese
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () =>
        set((state) => ({ language: state.language === "vi" ? "en" : "vi" })),
    }),
    {
      name: "sonvn-language", // LocalStorage key
    }
  )
);
