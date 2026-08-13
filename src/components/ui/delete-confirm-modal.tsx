"use client";

import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { AlertTriangle, X } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: DeleteConfirmModalProps) {
  const { language } = useLanguageStore();

  const defaultTitle = language === "vi" ? "Xác nhận xóa?" : "Confirm Delete?";
  const defaultMessage =
    language === "vi"
      ? "Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác."
      : "Are you sure you want to delete this item? This action cannot be undone.";

  return (
    <AnimatePresence>
      {isOpen && (
        <safeMotion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          // Scrim dims only — no blur, no glassmorphism (design.md § Shared chrome).
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black/45 p-fl-sm"
        >
          <safeMotion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            // A modal visibly floats above the page — shadow allowed here.
            className="relative w-full max-w-md cursor-default rounded-surface border border-atelier-rule bg-atelier-paper p-fl-md text-left shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-fl-2xs top-fl-2xs flex h-11 w-11 items-center justify-center rounded-control text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 hover:text-atelier-ink md:h-10 md:w-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content layout */}
            <div className="flex items-start gap-fl-sm">
              {/* Warning Icon */}
              <div className="shrink-0 rounded-surface bg-atelier-paper-3 p-fl-xs text-atelier-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col gap-fl-3xs">
                <h3 className="fl-display text-fl-lg text-atelier-ink">
                  {title || defaultTitle}
                </h3>
                <p className="text-fl-sm text-atelier-ink-2">
                  {message || defaultMessage}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-fl-md flex justify-end gap-fl-2xs border-t border-atelier-rule pt-fl-sm">
              <button
                onClick={onClose}
                className="min-h-11 rounded-control border border-atelier-rule-strong bg-transparent px-fl-sm py-fl-3xs text-fl-sm font-medium text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 active:bg-atelier-paper-3 md:min-h-10"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="min-h-11 rounded-control bg-atelier-danger px-fl-md py-fl-3xs text-fl-sm font-medium text-atelier-accent-ink transition-[filter] duration-fl-fast ease-fl-out hover:brightness-90 active:brightness-[0.85] md:min-h-10"
              >
                {language === "vi" ? "Xác nhận xóa" : "Confirm Delete"}
              </button>
            </div>
          </safeMotion.div>
        </safeMotion.div>
      )}
    </AnimatePresence>
  );
}

