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

const kindClasses: Record<ToastKind, string> = {
  success: "border-emerald-200 text-emerald-950",
  error: "border-red-200 text-red-950",
  info: "border-sky-200 text-sky-950",
  warning: "border-amber-200 text-amber-950",
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
      className="pointer-events-none fixed right-4 top-24 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {activeMessages.map((message) => (
        <div
          key={message.id}
          className={`pointer-events-auto rounded-2xl border bg-white/95 px-4 py-3 shadow-xl backdrop-blur ${kindClasses[message.kind]}`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">
                {kindLabels[message.kind]}
              </p>
              <p className="mt-1 text-sm text-stone-700">{message.message}</p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900"
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
