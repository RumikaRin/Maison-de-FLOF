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
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[100] flex items-center justify-center p-4 cursor-pointer"
        >
          <safeMotion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-warm-150 w-full max-w-md rounded-2xl shadow-xl p-6 relative cursor-default text-left"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-warm-400 hover:text-warm-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content layout */}
            <div className="flex gap-4 items-start">
              {/* Warning Icon */}
              <div className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5 flex-1">
                <h3 className="font-serif font-bold text-base text-warm-900 leading-tight">
                  {title || defaultTitle}
                </h3>
                <p className="text-xs text-warm-550 leading-relaxed font-semibold">
                  {message || defaultMessage}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex justify-end gap-2.5 border-t border-warm-100 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-250 text-warm-900 rounded-xl transition-all cursor-pointer"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer"
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

