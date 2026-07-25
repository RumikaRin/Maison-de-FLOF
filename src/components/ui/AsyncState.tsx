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
        "mx-auto flex min-h-40 w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-sm",
        className,
      )}
    >
      {status === "loading" ? (
        <span
          aria-hidden="true"
          className="mb-4 h-8 w-8 rounded-full border-2 border-warm-200 border-t-jotun-teal motion-safe:animate-spin"
        />
      ) : null}
      <h2 className="font-serif text-xl font-bold text-warm-900">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-lg text-sm leading-6 text-warm-600">
          {description}
        </p>
      ) : null}
      {status === "error" && onRetry ? (
        <button
          ref={retryRef}
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-warm-900 px-5 py-2.5 text-xs font-bold text-white outline-none hover:bg-warm-800 focus-visible:ring-2 focus-visible:ring-jotun-teal focus-visible:ring-offset-2"
        >
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
