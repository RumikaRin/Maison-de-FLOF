"use client";

import { useEffect, useState } from "react";

export function useGoogleProviderAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkProvider() {
      try {
        const response = await fetch("/api/auth/providers", {
          cache: "no-store",
        });
        const providers: unknown = response.ok ? await response.json() : null;
        if (
          active &&
          providers !== null &&
          typeof providers === "object" &&
          "google" in providers
        ) {
          setAvailable(true);
        }
      } catch {
        // Keep Google sign-in hidden when provider discovery is unavailable.
      }
    }

    void checkProvider();
    return () => {
      active = false;
    };
  }, []);

  return available;
}
