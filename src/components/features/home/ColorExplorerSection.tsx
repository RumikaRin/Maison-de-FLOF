"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { COLOR_FAMILIES, COLOR_SWATCHES, FAMILY_METADATA } from "@/lib/constants/home-data";
import { Paint, PaintColor } from "@/types";

function hexToRgb(hex: string): string {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "N/A";
}

function roomImageForFamily(familyId: string) {
  switch (familyId) {
    case "green":
      return "/living_sage.webp";
    case "beige":
    case "white":
      return "/living_beige.webp";
    case "blue":
      return "/living_p5.webp";
    case "grey":
    case "purple":
      return "/living_grey.webp";
    case "yellow":
      return "/living_p6.webp";
    case "red":
    case "peach":
      return "/living_terracotta.webp";
    default:
      return "/living_sage.webp";
  }
}

interface ColorExplorerSectionProps {
  selectedFamily: string;
  setSelectedFamily: (id: string) => void;
  visWallMainColor: string;
  setVisWallMainColor: (hex: string) => void;
  wishlist: string[];
  toggleWishlist: (code: string) => void;
  paints: (Paint & { supplier?: { name: string }; soldCount?: number })[];
  colorCatalog: PaintColor[];
  addItem: (paint: any, quantity: number, color?: any) => void;
}

export function ColorExplorerSection({
  selectedFamily,
  setSelectedFamily,
  visWallMainColor,
  setVisWallMainColor,
  wishlist,
  toggleWishlist,
  paints,
  colorCatalog,
  addItem,
}: ColorExplorerSectionProps) {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();
  const filteredSwatches = COLOR_SWATCHES.filter((c) => c.family === selectedFamily);
  const currentSwatch =
    COLOR_SWATCHES.find((s) => s.hex === visWallMainColor) ||
    filteredSwatches[0] ||
    COLOR_SWATCHES[0];
  const familyMeta = COLOR_FAMILIES.find((f) => f.id === selectedFamily);

  const suggestedPaints = (() => {
    const matched = paints.filter((paint) =>
      paint.colors.some((colorCode) => {
        const colorObj = COLOR_SWATCHES.find((c) => c.code === colorCode);
        return colorObj?.family === selectedFamily;
      }),
    );
    return (matched.length ? matched : paints).slice(0, 4);
  })();

  return (
    <section id="color-explorer-section" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-0 w-[45%] h-[40%] bg-[radial-gradient(ellipse_at_top_left,_rgba(0,123,138,0.05),_transparent_65%)]" />

      <div className="relative w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-jotun-teal" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jotun-teal">
                {language === "vi" ? "Bảng màu" : "Palette"}
              </p>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm-950 leading-tight">
              {language === "vi" ? "Khám phá màu sắc của chúng tôi" : "Explore our paint colors"}
            </h2>
            <p className="mt-3 text-sm text-warm-550 leading-relaxed max-w-md">
              {language === "vi"
                ? "Chọn nhóm màu, xem trên phòng mẫu, lưu yêu thích và chọn sản phẩm phù hợp."
                : "Pick a family, preview on a sample room, save favorites, and match products."}
            </p>
          </div>
          <Link
            href="/colors"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-jotun-teal hover:text-jotun-teal-dark transition-colors shrink-0"
          >
            {language === "vi" ? "Xem toàn bộ bảng màu" : "Full color catalog"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Room preview */}
          <div className="lg:col-span-7">
            <div className="relative p-1.5 rounded-[1.5rem] bg-warm-100 border border-warm-200">
              <div className="relative aspect-[4/3] sm:aspect-video lg:aspect-[16/11] w-full overflow-hidden rounded-[1.2rem] bg-warm-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedFamily}-${visWallMainColor}`}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={roomImageForFamily(selectedFamily)}
                      alt={language === "vi" ? "Mô phỏng phòng khách" : "Living room preview"}
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0 mix-blend-multiply pointer-events-none transition-[background-color] duration-500"
                      style={{ backgroundColor: visWallMainColor, opacity: 0.28 }}
                      aria-hidden
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 text-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                    {language === "vi" ? "Mô phỏng không gian" : "Room preview"}
                  </p>
                  <p className="font-serif font-bold text-sm mt-0.5">
                    {language === "vi"
                      ? `Phòng khách · ${familyMeta?.name || ""}`
                      : `Living room · ${familyMeta?.nameEn || ""}`}
                  </p>
                  <p className="text-[11px] text-white/80 mt-0.5 font-mono">
                    {language === "vi" ? currentSwatch.name : currentSwatch.nameEn} · #{currentSwatch.code}
                  </p>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="mt-4 rounded-[1.35rem] border border-warm-200 bg-jotun-ivory-50 p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSwatch.code}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-warm-200">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-jotun-teal">
                        {language === "vi" ? "Chi tiết màu" : "Color specs"}
                      </p>
                      <h3 className="font-serif font-bold text-xl text-warm-950 mt-0.5">
                        {language === "vi" ? currentSwatch.name : currentSwatch.nameEn}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-9 h-9 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: currentSwatch.hex }}
                      />
                      <span className="text-xs font-mono font-bold text-warm-700 bg-white border border-warm-200 px-2.5 py-1 rounded-lg">
                        #{currentSwatch.code}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-warm-400 block mb-1">HEX</span>
                      <span className="text-sm font-mono font-bold text-warm-900">
                        {currentSwatch.hex.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-warm-400 block mb-1">RGB</span>
                      <span className="text-sm font-mono font-bold text-warm-900">
                        {hexToRgb(currentSwatch.hex)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-warm-400 block mb-1">
                        {language === "vi" ? "Phong cách" : "Style"}
                      </span>
                      <span className="text-xs font-bold text-warm-800">
                        {language === "vi"
                          ? FAMILY_METADATA[currentSwatch.family]?.styleVi || "Hiện đại"
                          : FAMILY_METADATA[currentSwatch.family]?.styleEn || "Modern"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-warm-400 block mb-1">
                        {language === "vi" ? "Không gian" : "Spaces"}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(language === "vi"
                          ? FAMILY_METADATA[currentSwatch.family]?.roomsVi
                          : FAMILY_METADATA[currentSwatch.family]?.roomsEn
                        )?.map((room) => (
                          <span
                            key={room}
                            className="text-[9px] bg-jotun-teal/10 text-jotun-teal px-1.5 py-0.5 rounded font-medium"
                          >
                            {room}
                          </span>
                        )) || (
                          <span className="text-[9px] text-warm-500">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-[1.35rem] border border-warm-200 bg-white p-5">
              <h3 className="font-semibold text-sm text-warm-900 mb-3">
                {language === "vi" ? "Chọn nhóm màu" : "Color families"}
              </h3>
              <div className="flex flex-row lg:grid lg:grid-cols-2 gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 lg:mx-0 lg:px-0">
                {COLOR_FAMILIES.map((family) => {
                  const isSelected = selectedFamily === family.id;
                  return (
                    <button
                      key={family.id}
                      type="button"
                      onClick={() => {
                        setSelectedFamily(family.id);
                        const first = COLOR_SWATCHES.find((c) => c.family === family.id);
                        if (first) setVisWallMainColor(first.hex);
                      }}
                      className={cn(
                        "w-[150px] lg:w-full shrink-0 flex flex-col p-3 rounded-xl border text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-jotun-teal",
                        isSelected
                          ? "bg-warm-900 text-white border-warm-900 shadow-md"
                          : "bg-jotun-ivory-50 text-warm-800 border-warm-200 hover:border-warm-400",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: family.hex }}
                        />
                        <span className="text-xs font-bold truncate flex-grow">
                          {language === "vi" ? family.name : family.nameEn}
                        </span>
                        {isSelected && <Check className="h-3 w-3 shrink-0" />}
                      </div>
                      <p
                        className={cn(
                          "text-[9px] leading-normal line-clamp-2",
                          isSelected ? "text-white/70" : "text-warm-500",
                        )}
                      >
                        {language === "vi" ? family.desc : family.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-warm-200 bg-white p-5 flex-grow">
              <h3 className="font-semibold text-sm text-warm-900 mb-3">
                {language === "vi"
                  ? `Mã màu · ${familyMeta?.name || ""}`
                  : `Shades · ${familyMeta?.nameEn || ""}`}
              </h3>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFamily}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-3 gap-2.5"
                >
                  {(filteredSwatches.length ? filteredSwatches : COLOR_SWATCHES.slice(0, 6)).map(
                    (swatch) => {
                      const isFav = wishlist.includes(swatch.code);
                      const isActive = visWallMainColor === swatch.hex;
                      return (
                        <div
                          key={swatch.code}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setVisWallMainColor(swatch.hex);
                            toast.success(
                              language === "vi"
                                ? `Đã chọn màu ${swatch.name}`
                                : `Selected ${swatch.nameEn || swatch.name}`,
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setVisWallMainColor(swatch.hex);
                            }
                          }}
                          className={cn(
                            "border rounded-xl p-2 flex flex-col gap-1.5 cursor-pointer text-left transition-all",
                            isActive
                              ? "border-warm-900 ring-1 ring-warm-900/15 bg-white shadow-sm"
                              : "border-warm-200 bg-jotun-ivory-50 hover:border-warm-400",
                          )}
                        >
                          <div
                            className="h-11 rounded-lg border border-black/5 relative shadow-inner"
                            style={{ backgroundColor: swatch.hex }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(swatch.code);
                              }}
                              className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-white rounded-full text-warm-400 hover:text-rose-500 shadow-sm z-10"
                              aria-label="favorite"
                            >
                              <Heart
                                className={cn(
                                  "h-2.5 w-2.5",
                                  isFav && "fill-rose-500 text-rose-500",
                                )}
                              />
                            </button>
                          </div>
                          <span className="text-[8px] font-mono font-bold text-warm-400 truncate">
                            #{swatch.code}
                          </span>
                          <span className="text-[10px] font-semibold text-warm-850 truncate">
                            {language === "vi" ? swatch.name : swatch.nameEn}
                          </span>
                        </div>
                      );
                    },
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Suggested products - full feature retained */}
        <div className="mt-10 md:mt-12 rounded-[1.5rem] border border-warm-200 bg-jotun-ivory p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-jotun-teal mb-1">
                {language === "vi" ? "Gợi ý sản phẩm" : "Suggested products"}
              </p>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-warm-950">
                {language === "vi"
                  ? `Sơn phù hợp tông ${familyMeta?.name || ""}`
                  : `Paints for ${familyMeta?.nameEn || ""} tones`}
              </h3>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-jotun-teal inline-flex items-center gap-1"
            >
              {language === "vi" ? "Tất cả sản phẩm" : "All products"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto scrollbar-none snap-x pb-1 -mx-1 px-1">
            {suggestedPaints.map((paint) => {
              const matchingColorCode = paint.colors.find((colorCode) => {
                const colorObj = COLOR_SWATCHES.find((c) => c.code === colorCode);
                return colorObj?.family === selectedFamily;
              });
              const defaultColorObj = matchingColorCode
                ? colorCatalog.find((c) => c.code === matchingColorCode)
                : colorCatalog[0];

              return (
                <div
                  key={paint.id}
                  className="snap-start shrink-0 w-[70vw] max-w-[260px] md:w-auto md:max-w-none bg-white border border-warm-200 rounded-2xl p-3 flex flex-col group"
                >
                  <Link
                    href={`/products/${paint.slug}`}
                    className="relative w-full aspect-[4/3] bg-warm-50 rounded-xl overflow-hidden border border-warm-100 mb-3"
                  >
                    <Image
                      src={paint.images?.[0] || "/product_interior.webp"}
                      alt={paint.name}
                      fill
                      className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                    />
                    {paint.discountPercent && paint.discountPercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        -{paint.discountPercent}%
                      </span>
                    )}
                  </Link>
                  <Link href={`/products/${paint.slug}`}>
                    <p className="text-[9px] font-mono font-bold uppercase text-warm-400">
                      {paint.supplier?.name || "Maison de FLOF"}
                    </p>
                    <h4 className="font-serif font-bold text-sm text-warm-900 group-hover:text-jotun-teal line-clamp-1 mt-0.5">
                      {language === "vi" ? paint.name : paint.nameEn}
                    </h4>
                  </Link>
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-warm-100 gap-2">
                    {paint.discountPercent && paint.discountPercent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-red-500">
                          {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                        </span>
                        <span className="text-[9px] font-mono text-warm-400 line-through">
                          {formatPrice(paint.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-bold text-warm-900">
                        {formatPrice(paint.price)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        addItem(paint, 1, defaultColorObj);
                        toast.success(
                          language === "vi"
                            ? `Đã thêm ${paint.name} vào giỏ hàng`
                            : `Added ${paint.nameEn} to cart`,
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-warm-900 text-white text-[10px] font-bold px-2.5 py-1.5 hover:bg-warm-800"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      {language === "vi" ? "Mua" : "Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
