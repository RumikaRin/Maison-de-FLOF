"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { safeMotion, AnimatePresence, useReducedMotion } from "@/components/ui/motion-safe";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { cn, formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { Paint, PaintColor } from "@/types";

interface FeaturedProductsSectionProps {
  activeTab: "bestseller" | "new" | "promo";
  setActiveTab: (tab: "bestseller" | "new" | "promo") => void;
  isTabLoading: boolean;
  setIsTabLoading: (loading: boolean) => void;
  paints: (Paint & { supplier?: { name: string }; soldCount?: number })[];
  colorCatalog: PaintColor[];
  handleAddToCart: (prod: any) => void;
  commerceAvailable: boolean;
}

/**
 * Shop-style product grid (coffee "online store" + Aura furniture ecom):
 * soft card plates, clear price hierarchy, add-to-cart affordance.
 */
export function FeaturedProductsSection({
  activeTab,
  setActiveTab,
  isTabLoading,
  setIsTabLoading,
  paints,
  handleAddToCart,
  commerceAvailable,
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
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Soft atmosphere wash */}
      <div className="pointer-events-none absolute top-0 right-0 w-[40%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,123,138,0.06),_transparent_60%)]" />

      <div className="relative w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl text-left">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-jotun-teal" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jotun-teal">
                {language === "vi" ? "Cửa hàng" : "Shop"}
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-serif font-bold text-warm-950 leading-tight">
              {language === "vi" ? "Sản phẩm sơn nước nổi bật" : "Featured paint products"}
            </h2>
            <p className="mt-3 text-sm text-warm-550 max-w-md leading-relaxed">
              {language === "vi"
                ? "Dòng sơn chính hãng bán chạy, mới ra mắt và đang khuyến mãi."
                : "Bestsellers, new arrivals, and current promotions."}
            </p>
          </div>

          <div className="flex gap-1 p-1 rounded-full bg-warm-100/90 border border-warm-200 self-start md:self-auto shadow-sm">
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
                  }, 260);
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
                  activeTab === tab.value
                    ? "bg-warm-900 text-white shadow-sm"
                    : "text-warm-500 hover:text-warm-900",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {isTabLoading ? (
              <safeMotion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[300px] flex items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full border-2 border-warm-200 border-t-jotun-teal animate-spin" />
              </safeMotion.div>
            ) : (
              <safeMotion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
              >
                {list.map((paint, index) => {
                  const prod = {
                    id: paint.id,
                    name: paint.name,
                    nameEn: paint.nameEn,
                    desc: paint.description,
                    descEn: paint.descriptionEn,
                  };
                  const hasDiscount = Boolean(paint.discountPercent && paint.discountPercent > 0);
                  const finalPrice = hasDiscount
                    ? paint.price * (1 - (paint.discountPercent || 0) / 100)
                    : paint.price;

                  return (
                    <safeMotion.article
                      key={paint.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.45,
                        delay: reduceMotion ? 0 : index * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="group relative flex flex-col rounded-[1.5rem] bg-jotun-ivory border border-warm-200/90 overflow-hidden shadow-[0_8px_30px_rgba(47,40,34,0.04)] hover:shadow-[0_18px_50px_rgba(47,40,34,0.1)] transition-shadow duration-500"
                    >
                      <Link
                        href={`/products/${paint.slug}`}
                        className="relative aspect-[4/5] sm:aspect-square bg-white overflow-hidden"
                      >
                        <Image
                          src={getProductImage(paint.images)}
                          alt={language === "vi" ? prod.name : prod.nameEn || prod.name}
                          fill
                          sizes="(min-width: 768px) 30vw, 45vw"
                          className="object-contain p-6 sm:p-8 transition-transform duration-700 group-hover:scale-105"
                        />
                        {hasDiscount && (
                          <span className="absolute top-3 left-3 rounded-full bg-warm-900 text-white text-[10px] font-bold px-2.5 py-1">
                            -{paint.discountPercent}%
                          </span>
                        )}
                      </Link>

                      <div className="flex flex-col flex-grow p-4 sm:p-5">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-warm-400">
                          {paint.supplier?.name || "Maison de FLOF"}
                        </p>
                        <Link href={`/products/${paint.slug}`}>
                          <h3 className="mt-1.5 font-serif font-bold text-sm sm:text-base text-warm-950 group-hover:text-jotun-teal transition-colors line-clamp-2 leading-snug">
                            {language === "vi" ? prod.name : prod.nameEn || prod.name}
                          </h3>
                        </Link>

                        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm sm:text-base font-mono font-bold text-warm-950">
                              {formatPrice(finalPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] font-mono text-warm-400 line-through">
                                {formatPrice(paint.price)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            disabled={!commerceAvailable}
                            aria-disabled={!commerceAvailable}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-jotun-teal text-white text-[10px] sm:text-[11px] font-bold px-3.5 py-2.5 hover:bg-jotun-teal-dark transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={language === "vi" ? "Thêm vào giỏ" : "Add to cart"}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline sm:inline">
                              {language === "vi" ? "Thêm" : "Add"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </safeMotion.article>
                  );
                })}
              </safeMotion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border border-warm-300 bg-white px-6 py-3 text-xs font-bold text-warm-900 hover:border-jotun-teal/40 hover:text-jotun-teal transition-colors"
          >
            {language === "vi" ? "Khám phá thêm sản phẩm" : "Explore more products"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


