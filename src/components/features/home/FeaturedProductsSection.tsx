"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
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
  colorCatalog,
  handleAddToCart
}: FeaturedProductsSectionProps) {
  const { language } = useLanguageStore();

  return (
    <section className="py-16 md:py-28 bg-white">
      <div className="w-full max-w-[1200px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6"
        >
          <div className="max-w-xl text-left">
            <h2 className="text-2xl md:text-3.5xl lg:text-4xl font-serif font-bold text-warm-900 mb-2">
              {language === "vi" ? "Sản Phẩm Sơn Nước Nổi Bật" : "Featured Paint Products"}
            </h2>
            <p className="text-warm-550 text-xs">
              {language === "vi"
                ? "Danh sách các dòng sơn chính hãng chất lượng cao bán chạy nhất hiện nay."
                : "Top-selling premium authentic paint lines of the highest quality available today."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex gap-1 bg-warm-100 p-1 rounded-full border border-black/5">
              {[
                { value: "bestseller", label: language === "vi" ? "Bán chạy nhất" : "Bestsellers" },
                { value: "new", label: language === "vi" ? "Mới nhất" : "New" },
                { value: "promo", label: language === "vi" ? "Khuyến mãi" : "Promotions" }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    if (tab.value === activeTab) return;
                    setIsTabLoading(true);
                    setTimeout(() => {
                      setActiveTab(tab.value as any);
                      setIsTabLoading(false);
                    }, 400);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                    activeTab === tab.value ? "bg-white text-warm-900 shadow-sm" : "text-warm-500 hover:text-warm-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="relative min-h-[350px]">
          <AnimatePresence mode="wait">
            {isTabLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-[350px] flex flex-col items-center justify-center gap-4 w-full py-16"
              >
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-warm-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-jotun-teal border-t-transparent animate-spin" />
                </div>
                <p className="text-xs text-warm-550 font-medium tracking-wide">
                  {language === "vi" ? "Đang tải sản phẩm..." : "Loading products..."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } }
                }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8"
              >
                {[...paints]
                  .filter((paint) => activeTab !== "promo" || (paint.discountPercent || 0) > 0)
                  .sort((a, b) => activeTab === "bestseller" ? (b.soldCount || 0) - (a.soldCount || 0) : 0)
                  .slice(0, 3)
                  .map((paint) => {
                  const prod = {
                    id: paint.id,
                    name: paint.name,
                    nameEn: paint.nameEn,
                    rating: 5,
                    desc: paint.description,
                    descEn: paint.descriptionEn,
                  };
                  const slug = paint.slug;
                  return (
                    <motion.div
                      key={prod.id}
                      variants={{
                        hidden: { opacity: 0, y: 32 },
                        visible: { opacity: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.7 } }
                      }}
                      className="bg-white p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-4 rounded-xl border border-black/5 hover:shadow-lg transition-all duration-500 h-full group relative"
                    >
                      <Link href={`/products/${slug}`} className="flex flex-col gap-2.5 sm:gap-4 flex-grow cursor-pointer">
                        <div className="relative h-36 xs:h-44 sm:h-64 md:h-80 w-full bg-jotun-ivory-100 rounded-xl overflow-hidden border border-black/5 flex items-center justify-center p-2.5 sm:p-6 shadow-inner">
                          <Image
                            src={paint.images?.[0] || "/product_interior.webp"}
                            alt={language === "vi" ? prod.name : (prod.nameEn || prod.name)}
                            fill
                            className="object-contain p-2.5 sm:p-6 transition-transform duration-700 group-hover:scale-105"
                          />
                          {paint.discountPercent && paint.discountPercent > 0 && (
                            <div className="absolute top-1.5 left-1.5 xs:top-3.5 xs:left-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-mono text-[9px] xs:text-xs font-extrabold px-1.5 py-0.5 xs:px-3 xs:py-1 rounded-md xs:rounded-lg shadow-md z-10 animate-pulse select-none border border-white/20">
                              -{paint.discountPercent}%
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 sm:gap-2 flex-grow text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-warm-400 font-mono">
                              {paint.supplier?.name || "Maison de FLOF"}
                            </span>
                            <div className="flex gap-0.5 text-jotun-teal">
                              {Array.from({ length: prod.rating }).map((_, i) => (
                                <Star key={i} className="h-2 w-2 sm:h-3 sm:w-3 fill-current" />
                              ))}
                            </div>
                          </div>

                          <h3 className="font-serif font-bold text-xs sm:text-base group-hover:text-jotun-teal transition-colors text-warm-900 line-clamp-1">
                            {language === "vi" ? prod.name : (prod.nameEn || prod.name)}
                          </h3>

                          <p className="text-[10px] sm:text-xs text-warm-500 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                            {language === "vi" ? prod.desc : (prod.descEn || prod.desc)}
                          </p>
                        </div>
                      </Link>

                      <div className="mt-auto pt-2.5 sm:pt-4 border-t border-black/5 flex items-center justify-between gap-1">
                        {paint.discountPercent && paint.discountPercent > 0 ? (
                          <div className="flex flex-col items-start">
                            <span className="text-xs sm:text-base font-mono font-bold text-red-500">
                              {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                            </span>
                            <span className="text-[9px] sm:text-xs font-mono text-warm-400 line-through">
                              {formatPrice(paint.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-base font-extrabold text-warm-900 font-mono">
                            {formatPrice(paint.price)}
                          </span>
                        )}
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="btn-island bg-warm-900 hover:bg-warm-800 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-4 sm:py-2 gap-1.5 sm:gap-3"
                        >
                          <span>
                            {language === "vi" ? "Mua" : "Buy"}
                            <span className="hidden xs:inline">{language === "vi" ? " ngay" : " now"}</span>
                          </span>
                          <span className="btn-island-icon bg-white/20 w-5 h-5 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-full">
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
