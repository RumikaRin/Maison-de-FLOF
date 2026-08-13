/* Hallmark · genre: editorial · section: featured products · knobs: lead=7/5 feature row, supporting=5-up dense catalogue, tabs=C1 outlined chips · design-system: design.md · designed-as-app */
"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { useState } from "react";
import { safeMotion, AnimatePresence, useReducedMotion } from "@/components/ui/motion-safe";
import { useLanguageStore } from "@/store/language-store";
import { cn, formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { Paint, PaintColor } from "@/types";
import {
  EditorialSection,
  EditorialHeading,
  Rule,
  TypographicLink,
} from "@/components/ui/editorial";

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
 * Featured products — merchandising with hierarchy. The leading product takes
 * a 7/5 feature row; the supporting five run in a dense catalogue rhythm on
 * hairlines. No card boxes, no badges: the discount is part of the price line.
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
  const [hasInteracted, setHasInteracted] = useState(false);

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

  const [lead, ...supporting] = list;

  const priceLine = (paint: Paint) => {
    const hasDiscount = Boolean(paint.discountPercent && paint.discountPercent > 0);
    const finalPrice = hasDiscount
      ? paint.price * (1 - (paint.discountPercent || 0) / 100)
      : paint.price;
    return { hasDiscount, finalPrice };
  };

  return (
    <EditorialSection
      rhythm="generous"
      frame
      className="fl-rise bg-atelier-paper-2"
      data-fl-io
    >
      <div className="flex flex-col gap-fl-sm md:flex-row md:items-end md:justify-between">
        <EditorialHeading
          as="h2"
          scale="3xl"
          label={language === "vi" ? "Cửa hàng" : "Shop"}
        >
          {language === "vi" ? "Sản phẩm sơn nổi bật" : "Featured paint products"}
        </EditorialHeading>

        {/* Filter chips — C1 outlined, rectangular */}
        <div role="group" aria-label={language === "vi" ? "Lọc sản phẩm" : "Filter products"} className="flex gap-fl-2xs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={activeTab === tab.value}
              onClick={() => {
                if (tab.value === activeTab) return;
                setHasInteracted(true);
                setIsTabLoading(true);
                setTimeout(() => {
                  setActiveTab(tab.value);
                  setIsTabLoading(false);
                }, 260);
              }}
              className={cn(
                "min-h-11 whitespace-nowrap rounded-control border px-fl-sm text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-10",
                activeTab === tab.value
                  ? "border-atelier-ink bg-atelier-ink text-atelier-paper"
                  : "border-atelier-rule-strong text-atelier-ink-2 hover:border-atelier-ink hover:text-atelier-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Rule className="mt-fl-md" weight="strong" />

      <div
        className={cn(
          "relative min-h-[300px]",
          hasInteracted && "fl-noreplay",
        )}
      >
        <AnimatePresence mode="wait">
          {isTabLoading ? (
            <safeMotion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[300px] items-center justify-center"
              role="status"
              aria-live="polite"
            >
              <span className="fl-label">
                {language === "vi" ? "Đang tải…" : "Loading…"}
              </span>
            </safeMotion.div>
          ) : (
            <safeMotion.div
              key={activeTab}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.24 }}
            >
              {lead ? (
                (() => {
                  const { hasDiscount, finalPrice } = priceLine(lead);
                  return (
                    <article className="fl-stagger grid grid-cols-1 gap-y-fl-md py-fl-lg md:grid-cols-12 md:gap-x-fl-lg">
                      <Link
                        href={`/products/${lead.slug}`}
                        className="fl-blurup group relative block aspect-[4/3] overflow-hidden rounded-surface bg-atelier-paper md:col-span-7"
                      >
                        <Image
                          src={getProductImage(lead.images)}
                          alt={language === "vi" ? lead.name : lead.nameEn || lead.name}
                          fill
                          sizes="(min-width: 768px) 55vw, 100vw"
                          className="object-contain p-fl-lg transition-transform duration-fl-slow ease-fl-out group-hover:scale-[1.03] motion-reduce:transform-none"
                        />
                      </Link>
                      <div className="flex flex-col items-start md:col-span-5 md:pt-fl-md">
                        <p className="fl-label">
                          {lead.supplier?.name || "Maison de FLOF"}
                        </p>
                        <Link href={`/products/${lead.slug}`}>
                          <h3 className="fl-display mt-fl-2xs text-fl-2xl text-atelier-ink">
                            {language === "vi" ? lead.name : lead.nameEn || lead.name}
                          </h3>
                        </Link>
                        <p className="fl-measure-tight mt-fl-sm text-fl-sm text-atelier-ink-2 line-clamp-3">
                          {language === "vi" ? lead.description : lead.descriptionEn}
                        </p>
                        <p className="mt-fl-md flex items-baseline gap-fl-xs">
                          <span className={cn("text-fl-xl tabular-nums", hasDiscount ? "text-atelier-danger" : "text-atelier-ink")}>
                            {formatPrice(finalPrice)}
                          </span>
                          {hasDiscount ? (
                            <>
                              <span className="text-fl-sm tabular-nums text-atelier-ink-3 line-through">
                                {formatPrice(lead.price)}
                              </span>
                              <span className="fl-label !text-atelier-danger">
                                −{lead.discountPercent}%
                              </span>
                            </>
                          ) : null}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart({
                              id: lead.id,
                              name: lead.name,
                              nameEn: lead.nameEn,
                            })
                          }
                          disabled={!commerceAvailable}
                          aria-disabled={!commerceAvailable}
                          className="mt-fl-md inline-flex min-h-11 items-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-accent-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-accent-hover disabled:cursor-not-allowed disabled:opacity-45 md:min-h-10"
                        >
                          {language === "vi" ? "Thêm vào giỏ" : "Add to cart"}
                        </button>
                      </div>
                    </article>
                  );
                })()
              ) : (
                <p className="py-fl-lg text-fl-sm text-atelier-ink-2">
                  {language === "vi"
                    ? "Chưa có sản phẩm trong mục này."
                    : "No products in this list yet."}
                </p>
              )}

              {supporting.length > 0 ? (
                <>
                  <Rule />
                  <div className="fl-stagger grid grid-cols-2 gap-x-fl-md md:grid-cols-5">
                    {supporting.map((paint) => {
                      const { hasDiscount, finalPrice } = priceLine(paint);
                      return (
                        <article
                          key={paint.id}
                          className="fl-blurup flex flex-col border-b border-atelier-rule pb-fl-sm pt-fl-sm"
                        >
                          <Link
                            href={`/products/${paint.slug}`}
                            className="group relative block aspect-square overflow-hidden rounded-surface bg-atelier-paper"
                          >
                            <Image
                              src={getProductImage(paint.images)}
                              alt={language === "vi" ? paint.name : paint.nameEn || paint.name}
                              fill
                              sizes="(min-width: 768px) 18vw, 45vw"
                              className="object-contain p-fl-xs transition-transform duration-fl-slow ease-fl-out group-hover:scale-[1.03] motion-reduce:transform-none"
                            />
                          </Link>
                          <Link href={`/products/${paint.slug}`} className="mt-fl-xs block">
                            <h3 className="truncate font-serif text-fl-md text-atelier-ink">
                              {language === "vi" ? paint.name : paint.nameEn || paint.name}
                            </h3>
                          </Link>
                          <div className="mt-auto flex items-baseline justify-between gap-fl-2xs pt-fl-2xs">
                            <span className={cn("text-fl-sm tabular-nums", hasDiscount ? "text-atelier-danger" : "text-atelier-ink")}>
                              {formatPrice(finalPrice)}
                              {hasDiscount ? (
                                <span className="ml-1 text-fl-2xs">−{paint.discountPercent}%</span>
                              ) : null}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart({
                                  id: paint.id,
                                  name: paint.name,
                                  nameEn: paint.nameEn,
                                })
                              }
                              disabled={!commerceAvailable}
                              aria-disabled={!commerceAvailable}
                              aria-label={
                                language === "vi"
                                  ? `Thêm ${paint.name} vào giỏ`
                                  : `Add ${paint.nameEn || paint.name} to cart`
                              }
                              className="min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 disabled:cursor-not-allowed disabled:opacity-45 md:min-h-6"
                            >
                              {language === "vi" ? "Thêm" : "Add"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </safeMotion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-fl-lg">
        <TypographicLink href="/products">
          {language === "vi" ? "Khám phá thêm sản phẩm" : "Explore more products"}
        </TypographicLink>
      </div>
    </EditorialSection>
  );
}
