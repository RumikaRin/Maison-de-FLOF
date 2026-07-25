"use client";

import { AnimatePresence, safeMotion } from "@/components/ui/motion-safe";
import { useLanguageStore } from "@/store/language-store";
import { Loader2 } from "@/components/ui/loader-2";

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
          className="fullscreen-loader fixed inset-0 z-[10000] flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-jotun-ivory px-6 text-center text-warm-900"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40" />
          <safeMotion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 flex flex-col items-center gap-5"
          >
            <div className="flex items-center gap-2">
              <span className="font-bromise text-2xl font-bold uppercase tracking-[0.22em] text-warm-900">
                FLOF
              </span>
            </div>
            <Loader2 className="min-h-0 py-3" />
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-warm-500">
                {message || (language === "vi" ? "Đang chuẩn bị không gian..." : "Preparing your space...")}
              </p>
              <div className="mx-auto h-0.5 w-28 overflow-hidden rounded-full bg-warm-200">
                <span className="site-loader-progress block h-full w-1/2 rounded-full bg-jotun-teal" />
              </div>
            </div>
          </safeMotion.div>
        </safeMotion.div>
      )}
    </AnimatePresence>
  );
}

