"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { cn, formatPrice } from "@/lib/utils";
import { Paint, PaintColor } from "@/types";

interface FeaturedProductsSectionProps {
  activeTab: "bestseller" | "new" | "promo";
  setActiveTab: (tab: "bestseller" | "new" | "promo") => void;
  isTabLoading: boolean;
  setIsTabLoading: (loading: boolean) => void;
  paints: (Paint & { supplier?: { name: string }; soldCount?: number })[];
  colorCatalog: PaintColor[];
  handleAddToCart: (prod: any) => void;
}

export function FeaturedProductsSection({
  activeTab,
  setActiveTab,
  isTabLoading,
  setIsTabLoading,
  paints,
  handleAddToCart,
}: FeaturedProductsSectionProps) {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  const tabs = [
    { value: "bestseller" as const, label: language === "vi" ? "Bán chạy" : "Bestsellers" },
    { value: "new" as const, label: language === "vi" ? "Mới" : "New" },
    { value: "promo" as const, label: language === "vi" ? "Khuyến mãi" : "Promos" },
  ];

  const list = [...paints]
    .filter((paint) => activeTab !== "promo" || (paint.discountPercent || 0) > 0)
    .sort((a, b) =>
      activeTab === "bestseller" ? (b.soldCount || 0) - (a.soldCount || 0) : 0,
    )
    .slice(0, 6);

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
          <div className="max-w-lg text-left">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-warm-950">
              {language === "vi" ? "Sản phẩm sơn nước nổi bật" : "Featured paint products"}
            </h2>
            <p className="mt-2 text-sm text-warm-550">
              {language === "vi"
                ? "Dòng sơn chính hãng bán chạy, mới ra và đang khuyến mãi."
                : "Bestsellers, new arrivals and current promotions."}
            </p>
          </div>

          <div className="flex gap-1 p-1 rounded-full bg-warm-100 border border-warm-200 self-start md:self-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  if (tab.value === activeTab) return;
                  setIsTabLoading(true);
                  setTimeout(() => {
                    setActiveTab(tab.value);
                    setIsTabLoading(false);
                  }, 280);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                  activeTab === tab.value
                    ? "bg-white text-warm-900 shadow-sm"
                    : "text-warm-500 hover:text-warm-900",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait">
            {isTabLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[280px] flex items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full border-2 border-warm-200 border-t-jotun-teal animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5"
              >
                {list.map((paint, index) => {
                  const prod = {
                    id: paint.id,
                    name: paint.name,
                    nameEn: paint.nameEn,
                    rating: 5,
                    desc: paint.description,
                    descEn: paint.descriptionEn,
                  };

                  return (
                    <motion.article
                      key={paint.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.45,
                        delay: reduceMotion ? 0 : index * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="group rounded-[1.35rem] border border-warm-200 bg-jotun-ivory-50 p-3 sm:p-4 flex flex-col"
                    >
                      <Link
                        href={`/products/${paint.slug}`}
                        className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-warm-100 mb-3 sm:mb-4"
                      >
                        <Image
                          src={paint.images?.[0] || "/product_interior.webp"}
                          alt={language === "vi" ? prod.name : prod.nameEn || prod.name}
                          fill
                          sizes="(min-width: 768px) 30vw, 45vw"
                          className="object-contain p-4 sm:p-6 transition-transform duration-500 group-hover:scale-105"
                        />
                        {paint.discountPercent && paint.discountPercent > 0 && (
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                            -{paint.discountPercent}%
                          </span>
                        )}
                      </Link>

                      <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wide text-warm-400">
                        {paint.supplier?.name || "Maison de FLOF"}
                      </p>
                      <Link href={`/products/${paint.slug}`}>
                        <h3 className="mt-1 font-serif font-bold text-sm sm:text-base text-warm-900 group-hover:text-jotun-teal transition-colors line-clamp-2">
                          {language === "vi" ? prod.name : prod.nameEn || prod.name}
                        </h3>
                      </Link>

                      <div className="mt-auto pt-3 sm:pt-4 flex items-center justify-between gap-2 border-t border-warm-200/80">
                        {paint.discountPercent && paint.discountPercent > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-mono font-bold text-red-500">
                              {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                            </span>
                            <span className="text-[10px] font-mono text-warm-400 line-through">
                              {formatPrice(paint.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm font-mono font-bold text-warm-900">
                            {formatPrice(paint.price)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(prod)}
                          className="inline-flex items-center gap-1 rounded-full bg-warm-900 text-white text-[10px] sm:text-[11px] font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 hover:bg-warm-800 transition-colors active:scale-[0.98]"
                        >
                          {language === "vi" ? "Thêm" : "Add"}
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-jotun-teal hover:text-jotun-teal-dark transition-colors"
          >
            {language === "vi" ? "Xem toàn bộ sản phẩm" : "View all products"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
