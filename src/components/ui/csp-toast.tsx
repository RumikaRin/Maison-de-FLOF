"use client";

import { useEffect, useSyncExternalStore } from "react";

type ToastKind = "success" | "error" | "info" | "warning";

type ToastMessage = {
  id: number;
  kind: ToastKind;
  message: string;
};

const listeners = new Set<() => void>();
const serverSnapshot: ToastMessage[] = [];
let messages: ToastMessage[] = [];
let nextId = 1;

function emit() {
  for (const listener of listeners) listener();
}

function dismiss(id: number) {
  messages = messages.filter((message) => message.id !== id);
  emit();
}

function publish(kind: ToastKind, message: string) {
  const id = nextId++;
  messages = [...messages.slice(-3), { id, kind, message }];
  emit();

  window.setTimeout(() => dismiss(id), 3_500);
  return id;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return messages;
}

export const toast = {
  success: (message: string) => publish("success", message),
  error: (message: string) => publish("error", message),
  info: (message: string) => publish("info", message),
  warning: (message: string) => publish("warning", message),
  dismiss,
};

/**
 * The kind is carried by the border and the label ink only — the message copy
 * always stays in body ink. design.md declares just two feedback tokens, so
 * `info` borrows the accent and `warning` the strong rule; the visible
 * `kindLabels` text keeps colour from being the sole carrier of meaning.
 */
const kindClasses: Record<ToastKind, string> = {
  success: "border-atelier-success text-atelier-success",
  error: "border-atelier-danger text-atelier-danger",
  info: "border-atelier-accent text-atelier-accent",
  warning: "border-atelier-rule-strong text-atelier-ink",
};

const kindLabels: Record<ToastKind, string> = {
  success: "Thành công",
  error: "Lỗi",
  info: "Thông tin",
  warning: "Cảnh báo",
};

export function CspToaster() {
  const activeMessages = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );

  useEffect(() => () => {
    messages = [];
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-4 top-24 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-fl-2xs"
      aria-live="polite"
      aria-atomic="false"
    >
      {activeMessages.map((message) => (
        // A toast visibly floats above the page — one of the two surfaces
        // design.md allows a shadow on. No blur, no translucency.
        <div
          key={message.id}
          className={`pointer-events-auto rounded-surface border bg-atelier-paper px-fl-sm py-fl-xs shadow-lg ${kindClasses[message.kind]}`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          <div className="flex items-start justify-between gap-fl-xs">
            <div>
              <p className="text-fl-2xs font-medium uppercase tracking-[0.14em]">
                {kindLabels[message.kind]}
              </p>
              <p className="mt-fl-3xs text-fl-sm text-atelier-ink">{message.message}</p>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-fl-md text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-3 hover:text-atelier-ink md:h-10 md:w-10"
              onClick={() => dismiss(message.id)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
