"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

import { AnimatePresence, safeMotion } from "@/components/ui/motion-safe";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function trapTabWithin(panel: HTMLElement | null, event: KeyboardEvent) {
  if (!panel) return;

  const focusable = [
    ...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ].filter((element) => !element.hasAttribute("hidden"));

  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  closeLabel?: string;
  className?: string;
};

export function MobileSheet({
  open,
  onClose,
  title,
  children,
  description,
  closeLabel = "Close dialog",
  className,
}: MobileSheetProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    if (!open) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () =>
      panelRef.current
        ?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?.focus({ preventScroll: true });
    const frame = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") trapTabWithin(panelRef.current, event);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end md:hidden">
          <safeMotion.button
            aria-hidden="true"
            className="absolute inset-0 cursor-default bg-atelier-espresso/35"
            onClick={onClose}
            tabIndex={-1}
            type="button"
          />
          <safeMotion.div
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className={cn(
              "relative max-h-[85dvh] w-full overflow-y-auto rounded-t-surface border-t border-atelier-rule-strong bg-atelier-paper px-fl-md pb-[max(var(--fl-space-md),env(safe-area-inset-bottom))] pt-fl-sm shadow-[0_-16px_40px_rgb(43_35_30_/_0.16)]",
              reducedMotion
                ? "transition-none"
                : "motion-safe:translate-y-0 motion-safe:transition-transform motion-safe:duration-fl-normal motion-safe:ease-fl-out motion-reduce:transition-none",
              className,
            )}
            ref={panelRef}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-fl-sm">
              <div>
                <h2 id={titleId} className="fl-display text-fl-xl">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-fl-3xs text-fl-sm text-atelier-ink-2">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                aria-label={closeLabel}
                className="-mr-fl-2xs -mt-fl-2xs inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control text-atelier-ink transition-colors hover:bg-atelier-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atelier-accent focus-visible:ring-offset-2"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-fl-md">{children}</div>
          </safeMotion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
