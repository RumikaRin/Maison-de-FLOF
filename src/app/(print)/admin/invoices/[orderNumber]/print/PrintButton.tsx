"use client";

import { Printer } from "lucide-react";

// Tiny client island: the ONLY interactive part of the print route.
// It is hidden in the printed output via `print:hidden` so it never
// appears on the paper invoice.
export function PrintButton() {
  return (
    <div className="mb-8 flex items-center justify-between gap-3 print:hidden">
      <p className="text-xs text-neutral-500">
        Nhấn nút để in hoặc lưu hóa đơn dưới dạng PDF (Ctrl/Cmd + P).
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700"
      >
        <Printer className="h-4 w-4" />
        In hóa đơn
      </button>
    </div>
  );
}
