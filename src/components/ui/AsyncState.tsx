"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AsyncStateProps = {
  status: "loading" | "error" | "empty";
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  focusRetry?: boolean;
  className?: string;
};

export function AsyncState({
  status,
  title,
  description,
  retryLabel = "Thử lại / Retry",
  onRetry,
  focusRetry = false,
  className,
}: AsyncStateProps) {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status === "error" && focusRetry) retryRef.current?.focus();
  }, [focusRetry, status]);

  return (
    <section
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      aria-busy={status === "loading"}
      className={cn(
        // A recessed panel, not a floating one — no shadow (design.md § Shape).
        "mx-auto flex min-h-40 w-full max-w-2xl flex-col items-center justify-center rounded-surface border border-atelier-rule bg-atelier-paper-2 p-fl-lg text-center",
        className,
      )}
    >
      {status === "loading" ? (
        <span
          aria-hidden="true"
          className="mb-fl-sm h-8 w-8 rounded-swatch border-2 border-atelier-rule-strong border-t-atelier-accent motion-safe:animate-spin"
        />
      ) : null}
      <h2 className="fl-display text-fl-xl text-atelier-ink">{title}</h2>
      {description ? (
        <p className="mt-fl-2xs max-w-lg text-fl-sm text-atelier-ink-2">
          {description}
        </p>
      ) : null}
      {status === "error" && onRetry ? (
        <button
          ref={retryRef}
          type="button"
          onClick={onRetry}
          className="mt-fl-md min-h-11 rounded-control border border-atelier-rule-strong bg-transparent px-fl-md py-fl-3xs text-fl-sm font-medium text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-3 active:bg-atelier-paper-3 md:min-h-10"
        >
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
