"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Paint, Category } from "@/types";
import { CustomSelect } from "@/components/ui/custom-select";

interface PaintsPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  paints: Paint[];
  language: string;
  onSuccess: (discountPercent: number, method: "category" | "single", targetId: string) => void;
}

export function PaintsPromoModal({
  isOpen,
  onClose,
  categories,
  paints,
  language,
  onSuccess,
}: PaintsPromoModalProps) {
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoMethod, setPromoMethod] = useState<"category" | "single">("category");
  const [promoSelectedCategoryId, setPromoSelectedCategoryId] = useState("");
  const [promoSelectedPaintId, setPromoSelectedPaintId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPromoDiscount(10);
      setPromoMethod("category");
      setPromoSelectedCategoryId(categories[0]?.id || "cat-1");
      setPromoSelectedPaintId(paints[0]?.id || "");
    }
  }, [isOpen, categories, paints]);

  const handleApplyPromotion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (promoDiscount < 0 || promoDiscount > 100) {
      toast.error(language === "vi" ? "Mức giảm giá phải từ 0% đến 100%." : "Discount must be between 0% and 100%.");
      return;
    }

    if (promoMethod === "single" && !promoSelectedPaintId) {
      toast.error(language === "vi" ? "Vui lòng chọn một sản phẩm." : "Please select a product.");
      return;
    }

    const response = await fetch("/api/admin/products/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discountPercent: promoDiscount,
        categoryId: promoMethod === "category" ? promoSelectedCategoryId : undefined,
        paintId: promoMethod === "single" ? promoSelectedPaintId : undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể áp dụng khuyến mãi");
      return;
    }

    toast.success(language === "vi" ? "Đã áp dụng mức giảm giá." : "Promotion applied.");
    onSuccess(promoDiscount, promoMethod, promoMethod === "category" ? promoSelectedCategoryId : promoSelectedPaintId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto text-left"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-warm-200 w-full max-w-md rounded-2xl shadow-2xl flex flex-col my-8 overflow-visible"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between bg-warm-50/50 rounded-t-2xl">
              <h3 className="font-serif font-bold text-base text-warm-900">
                {language === "vi" ? "Thiết lập chương trình Khuyến mãi" : "Set up Promotion"}
              </h3>
              <button
                onClick={onClose}
                className="text-warm-450 hover:text-warm-900 text-xs font-bold px-2 py-1 transition-colors"
              >
                {language === "vi" ? "[Đóng]" : "[Close]"}
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplyPromotion} className="p-6 pb-16 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  {language === "vi" ? "Mức giảm giá (%)" : "Discount Percentage (%)"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(Number(e.target.value))}
                  placeholder="E.g. 15"
                  className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  {language === "vi" ? "Áp dụng theo" : "Apply by"}
                </label>
                <CustomSelect
                  value={promoMethod}
                  onValueChange={(val) => setPromoMethod(val as any)}
                  options={[
                    { value: "category", label: language === "vi" ? "Danh mục sản phẩm" : "Product Category" },
                    { value: "single", label: language === "vi" ? "Đơn lẻ từng sản phẩm" : "Single Product" },
                  ]}
                />
              </div>

              <AnimatePresence mode="wait">
                {promoMethod === "category" ? (
                  <motion.div
                    key="promo-cat"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Chọn danh mục sơn" : "Select Category"}
                    </label>
                    <CustomSelect
                      value={promoSelectedCategoryId}
                      onValueChange={setPromoSelectedCategoryId}
                      options={categories.map((c) => ({
                        value: c.id,
                        label: language === "vi" ? c.name : c.nameEn,
                      }))}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="promo-single"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Chọn sản phẩm sơn" : "Select Paint Product"}
                    </label>
                    <CustomSelect
                      value={promoSelectedPaintId}
                      onValueChange={setPromoSelectedPaintId}
                      placeholder={language === "vi" ? "-- Chọn sản phẩm --" : "-- Select Paint --"}
                      options={paints.map((p) => ({
                        value: p.id,
                        label: `${p.sku} - ${language === "vi" ? p.name : p.nameEn}`,
                      }))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit panel */}
              <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-200 rounded-xl text-warm-900 transition-colors"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-warm-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-warm-800 transition-colors"
                >
                  {language === "vi" ? "Áp dụng" : "Apply"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
