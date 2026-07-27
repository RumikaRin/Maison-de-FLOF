/* Hallmark · genre: editorial · macrostructure: n/a (shared chrome) · design-system: design.md · designed-as-app */
"use client";

import { AnimatePresence, safeMotion } from "@/components/ui/motion-safe";
import { useLanguageStore } from "@/store/language-store";

/**
 * Restyled to the atelier tokens — timing, visibility contract and the
 * `fullscreen-loader` hook that globals.css keys its layout overrides off are
 * unchanged.
 *
 * Dropped: the radial dot-grid overlay (design.md § Notes bans grain and
 * decorative pattern fields), the Bromise wordmark (retired from public pages)
 * and the three-shape loader triad, whose colours are hard-coded outside the
 * token set. The hairline progress rule is now the only indicator.
 */
export function SiteLoadingScreen({
  visible = true,
  message,
}: {
  visible?: boolean;
  message?: string;
}) {
  const { language } = useLanguageStore();

  return (
    <AnimatePresence>
      {visible && (
        <safeMotion.div
          role="status"
          aria-live="polite"
          aria-label={message || (language === "vi" ? "Đang tải trang" : "Loading page")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fullscreen-loader fixed inset-0 z-[10000] flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-atelier-paper px-[clamp(1rem,4vw,1.5rem)] text-center text-atelier-ink"
        >
          <safeMotion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 flex flex-col items-center gap-fl-md"
          >
            <span className="fl-display text-fl-2xl text-atelier-ink">FLOF</span>
            <div className="flex flex-col items-center gap-fl-2xs">
              <p className="fl-label">
                {message || (language === "vi" ? "Đang chuẩn bị không gian..." : "Preparing your space...")}
              </p>
              <span className="block h-0.5 w-28 overflow-hidden bg-atelier-rule">
                <span className="site-loader-progress block h-full w-1/2 bg-atelier-accent" />
              </span>
            </div>
          </safeMotion.div>
        </safeMotion.div>
      )}
    </AnimatePresence>
  );
}
