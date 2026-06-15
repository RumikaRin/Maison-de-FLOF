"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PaintBucket, Check, Heart, ArrowRight, Star } from "lucide-react";
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
  addItem
}: ColorExplorerSectionProps) {
  const { language } = useLanguageStore();
  const filteredSwatches = COLOR_SWATCHES.filter(c => c.family === selectedFamily);

  return (
    <section id="color-explorer-section" className="py-16 md:py-20 bg-white from-[#F2F2EB] to-[#F8F8F2] relative overflow-hidden">
      {/* Parallax/floating decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#88734C]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#A9BBC8]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-12 w-4 h-4 rounded-full bg-[#A9BBC8]/30 animate-pulse pointer-events-none" />

      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center mb-10 text-center"
        >
          <motion.span
            className="text-[#88734C] font-semibold text-xs tracking-widest mb-3 flex items-center gap-2 uppercase"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PaintBucket className="w-4 h-4 text-[#88734C]" />
            {language === "vi" ? "SẮC MÀU THỜI THƯỢNG" : "TRENDING PALETTE"}
          </motion.span>
          <h2 className="text-3xl md:text-4.5xl lg:text-[3rem] font-serif font-bold text-warm-900 mb-2 leading-tight">
            {language === "vi" ? "Khám Phá Màu Sắc Của Chúng Tôi" : "Explore Our Paint Colors"}
          </h2>
          <motion.div
            className="w-24 h-1 bg-[#88734C] mx-auto mt-3 mb-6"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <p className="text-warm-550 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {language === "vi"
              ? "Duyệt nhóm màu sắc thời thượng bên dưới và tương tác phối màu trực quan"
              : "Browse trending color families below and interact with color visualizer"}
          </p>
        </motion.div>

        {/* Main Redesigned Layout Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8 items-start">
          {/* 1. Room Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="col-span-1 lg:col-span-8 order-1 lg:order-1 flex flex-col gap-8 w-full"
          >
            <div className="relative aspect-[4/3] sm:aspect-video lg:h-[500px] lg:aspect-none w-full overflow-hidden bg-white shadow-md rounded-3xl border border-warm-300 group">
              <Image
                src={
                  selectedFamily === "green" ? "/living_sage.png" :
                  selectedFamily === "beige" ? "/living_beige.png" :
                  selectedFamily === "blue" ? "/living_p5.png" :
                  selectedFamily === "grey" ? "/living_grey.png" :
                  selectedFamily === "yellow" ? "/living_p6.png" :
                  selectedFamily === "red" ? "/living_terracotta.png" :
                  selectedFamily === "peach" ? "/living_terracotta.png" :
                  selectedFamily === "purple" ? "/living_grey.png" :
                  "/living_sage.png"
                }
                alt={language === "vi" ? "Mô phỏng phòng khách" : "Room Preview"}
                fill
                sizes="(min-width: 1024px) 67vw, 100vw"
                className="object-cover"
              />

              <div className="absolute bottom-3 left-3 z-20 w-fit max-w-[calc(100%-24px)] backdrop-blur-md bg-black/40 border border-white/10 text-white rounded-xl p-3 sm:py-2.5 sm:px-4 flex flex-col gap-0.5 shadow-md text-left">
                <div>
                  <span className="text-[8px] font-bold text-warm-200/90 uppercase tracking-widest block mb-0.5">
                    {language === "vi" ? "MÔ PHÒNG KHÔNG GIAN" : "ROOM VISUALIZER"}
                  </span>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                    {language === "vi"
                      ? `Phòng Khách Tông ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.name}`
                      : `Living Room - ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.nameEn} Tone`
                    }
                  </h3>
                  <p className="text-[11px] text-white/80 font-light mt-0.5">
                    {language === "vi" ? "Mã màu phối: " : "Preview color: "}
                    <span className="font-semibold text-white">
                      {language === "vi" ? (COLOR_SWATCHES.find(s => s.hex === visWallMainColor) || filteredSwatches[0] || COLOR_SWATCHES[0]).name : (COLOR_SWATCHES.find(s => s.hex === visWallMainColor) || filteredSwatches[0] || COLOR_SWATCHES[0]).nameEn} ({(COLOR_SWATCHES.find(s => s.hex === visWallMainColor) || filteredSwatches[0] || COLOR_SWATCHES[0]).code})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. Color Family Selection */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
            className="col-span-1 lg:col-span-4 order-2 lg:order-2 flex flex-col gap-8 w-full"
          >
            <div className="bg-white border border-warm-300 rounded-3xl p-5 sm:p-6 shadow-xs text-left">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest block mb-0.5">
                  {language === "vi" ? "BẢNG MÀU CHỦ ĐẠO" : "COLOR FAMILIES"}
                </span>
                <h3 className="font-serif font-bold text-lg text-warm-900">
                  {language === "vi" ? "Chọn Nhóm Màu Sắc" : "Select Color Family"}
                </h3>
              </div>
              <div className="flex flex-row lg:grid lg:grid-cols-2 gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                {COLOR_FAMILIES.map((family) => {
                  const isSelected = selectedFamily === family.id;
                  return (
                    <button
                      key={family.id}
                      onClick={() => {
                        setSelectedFamily(family.id);
                        const firstSwatch = COLOR_SWATCHES.find(c => c.family === family.id);
                        if (firstSwatch) {
                          setVisWallMainColor(firstSwatch.hex);
                        }
                      }}
                      className={cn(
                        "w-[155px] lg:w-full shrink-0 flex flex-col p-3 rounded-xl border text-left transition-all duration-300 relative group focus:outline-none focus:ring-2 focus:ring-[#88734C]",
                        isSelected
                          ? "bg-white border-warm-900 shadow-md ring-1 ring-warm-900/10"
                          : "bg-white border-warm-300 hover:border-warm-450 hover:bg-warm-50/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5 w-full">
                        <span className="w-4.5 h-4.5 rounded-full border border-black/5 shadow-inner shrink-0" style={{ backgroundColor: family.hex }} />
                        <span className="text-xs font-bold text-warm-900 truncate flex-grow">
                          {language === "vi" ? family.name : family.nameEn}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-warm-900 text-white shrink-0">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-warm-550 leading-normal line-clamp-2">
                        {language === "vi" ? family.desc : family.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 3. Specific Swatches Grid Catalog */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
            className="col-span-1 lg:col-span-4 order-3 lg:order-4 flex flex-col gap-8 w-full"
          >
            <div className="bg-white border border-warm-300 rounded-3xl p-5 sm:p-6 shadow-xs text-left transition-all duration-300 flex-grow flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest block mb-0.5">
                  {language === "vi" ? "MÀU SƠN CHI TIẾT" : "SPECIFIC SHADES"}
                </span>
                <h3 className="font-serif font-bold text-lg text-warm-900">
                  {language === "vi"
                    ? `Bảng Mã Màu ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.name}`
                    : `${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.nameEn} Shades`
                  }
                </h3>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFamily}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                  className="grid grid-cols-3 gap-2.5"
                >
                  {filteredSwatches.map((swatch) => {
                    const isFav = wishlist.includes(swatch.code);
                    const isActive = visWallMainColor === swatch.hex;
                    return (
                      <div
                        key={swatch.code}
                        role="button"
                        onClick={() => {
                          setVisWallMainColor(swatch.hex);
                          toast.success(language === "vi" ? `Đã chọn màu ${swatch.name}!` : `Selected ${swatch.nameEn || swatch.name}!`);
                        }}
                        className={cn(
                          "border rounded-xl p-2 flex flex-col gap-1.5 items-stretch relative transition-all duration-300 cursor-pointer text-left w-full hover:shadow-2xs",
                          isActive ? "bg-white border-warm-900 ring-1 ring-warm-900/10" : "bg-white border-warm-300 hover:border-warm-450"
                        )}
                      >
                        <div className="h-10 rounded-lg border border-black/5 relative shadow-inner overflow-hidden flex-shrink-0" style={{ backgroundColor: swatch.hex }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(swatch.code);
                            }}
                            className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-white rounded-full text-warm-400 hover:text-rose-500 transition-colors shadow-2xs z-10"
                          >
                            <Heart className={cn("h-2.5 w-2.5", isFav ? "fill-rose-500 text-rose-500" : "")} />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-mono font-bold text-warm-400 block truncate">#{swatch.code}</span>
                          <span className="text-[9px] font-semibold text-warm-855 block truncate">
                            {language === "vi" ? swatch.name : swatch.nameEn}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 4. Selected Color Details */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.25 }}
            className="col-span-1 lg:col-span-8 order-4 lg:order-3 flex flex-col gap-8 w-full"
          >
            {(() => {
              const currentSwatch = COLOR_SWATCHES.find(s => s.hex === visWallMainColor) || filteredSwatches[0] || COLOR_SWATCHES[0];
              return (
                <div className="bg-white border border-warm-300 rounded-3xl p-6 shadow-xs text-left transition-all duration-300">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSwatch.code}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-warm-300 pb-4 mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest block mb-0.5">
                            {language === "vi" ? "THÔNG TIN CHI TIẾT" : "COLOR SPECIFICATIONS"}
                          </span>
                          <h3 className="font-serif font-bold text-xl text-warm-900">
                            {language === "vi" ? currentSwatch.name : currentSwatch.nameEn}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: currentSwatch.hex }} />
                          <span className="text-xs font-mono font-bold text-warm-700 bg-warm-50 px-2.5 py-1 rounded-lg">
                            Code: {currentSwatch.code}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div>
                          <span className="text-[10px] font-mono text-warm-400 block mb-1">HEX</span>
                          <span className="text-sm font-mono font-bold text-warm-900">{currentSwatch.hex.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-warm-400 block mb-1">RGB</span>
                          <span className="text-sm font-mono font-bold text-warm-900">{hexToRgb(currentSwatch.hex)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-warm-400 block mb-1">
                            {language === "vi" ? "PHONG CÁCH GỢI Ý" : "SUGGESTED STYLE"}
                          </span>
                          <span className="text-xs font-bold text-warm-800">
                            {language === "vi"
                              ? (FAMILY_METADATA[currentSwatch.family]?.styleVi || "Hiện đại")
                              : (FAMILY_METADATA[currentSwatch.family]?.styleEn || "Modern")
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-warm-400 block mb-1">
                            {language === "vi" ? "KHÔNG GIAN PHÙ HỢP" : "SUGGESTED SPACES"}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(language === "vi" ? FAMILY_METADATA[currentSwatch.family]?.roomsVi : FAMILY_METADATA[currentSwatch.family]?.roomsEn)?.map((room, i) => (
                              <span key={i} className="text-[9px] bg-[#88734C]/5 text-[#88734C] px-1.5 py-0.5 rounded font-medium">
                                {room}
                              </span>
                            )) || <span className="text-[9px] bg-warm-50 text-warm-600 px-1.5 py-0.5 rounded font-medium">N/A</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })()}
          </motion.div>
        </div>

        {/* 4. Product Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
          className="mt-8 sm:mt-12 bg-white border border-warm-300 rounded-3xl p-3 sm:p-8 shadow-xs text-center transition-all duration-300 w-full"
        >
          <div className="flex flex-col items-center mb-5 sm:mb-8">
            <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest flex items-center gap-1.5 mb-1.5 justify-center">
              <Star className="w-3.5 h-3.5 animate-pulse text-[#88734C]" />
              {language === "vi" ? "PHỐI HỢP HOÀN HẢO" : "PERFECT COMBINATION"}
            </span>
            <h3 className="font-serif font-bold text-lg sm:text-2xl text-warm-900">
              {language === "vi" ? "Sản Phẩm Khuyên Dùng" : "Suggested Paint Products"}
            </h3>
            <p className="text-xs text-warm-550 mt-2 max-w-xl mx-auto">
              {language === "vi"
                ? `Các dòng sơn cao cấp phù hợp nhất cho nhóm màu ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.name}`
                : `Best premium paint types suggested for ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.nameEn} tones`
              }
            </p>
          </div>

          <div className="relative">
            <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-6 overflow-x-auto md:overflow-x-visible snap-x scrollbar-none pb-3 md:pb-0 justify-start md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
              {paints.filter(paint => {
                return paint.colors.some(colorCode => {
                  const colorObj = COLOR_SWATCHES.find(c => c.code === colorCode);
                  return colorObj?.family === selectedFamily;
                });
              }).slice(0, 4).map((paint) => {
                const matchingColorCode = paint.colors.find(colorCode => {
                  const colorObj = COLOR_SWATCHES.find(c => c.code === colorCode);
                  return colorObj?.family === selectedFamily;
                });
                const defaultColorObj = matchingColorCode ? colorCatalog.find(c => c.code === matchingColorCode) : undefined;

                return (
                  <div key={paint.id} className="bg-white p-2 xs:p-3 sm:p-4 border border-warm-300 rounded-2xl hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full relative group text-left min-w-[calc(50%-6px)] xs:min-w-[calc(50%-8px)] sm:min-w-[260px] md:min-w-0 snap-start shrink-0">
                    <Link href={`/products/${paint.slug}`} className="relative w-full aspect-[4/3] bg-warm-50/50 rounded-xl overflow-hidden border border-black/5 flex items-center justify-center p-1 xs:p-2 shadow-inner shrink-0 cursor-pointer">
                      <Image
                        src={paint.images?.[0] || "/product_interior.png"}
                        alt={paint.name}
                        fill
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                      {paint.discountPercent && paint.discountPercent > 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs z-10">
                          -{paint.discountPercent}%
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-col justify-between flex-grow mt-2 xs:mt-3">
                      <Link href={`/products/${paint.slug}`} className="flex flex-col gap-1">
                        <span className="text-[8px] xs:text-[9px] font-bold uppercase text-warm-400 tracking-wider font-mono">
                          {paint.supplier?.name || "Maison de FLOF"}
                        </span>
                        <h4 className="font-serif font-bold text-xs xs:text-sm text-warm-900 group-hover:text-[#88734C] transition-colors line-clamp-1">
                          {language === "vi" ? paint.name : paint.nameEn}
                        </h4>
                      </Link>

                      <div className="flex items-center justify-between mt-2 pt-2 xs:mt-3 border-t border-warm-300 gap-1">
                        {paint.discountPercent && paint.discountPercent > 0 ? (
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] xs:text-xs font-mono font-bold text-red-500">
                              {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                            </span>
                            <span className="text-[8px] xs:text-[9px] font-mono text-warm-400 line-through">
                              {formatPrice(paint.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] xs:text-xs font-extrabold text-warm-900 font-mono">
                            {formatPrice(paint.price)}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            addItem(paint, 1, defaultColorObj);
                            toast.success(
                              language === "vi"
                                ? `Đã thêm ${paint.name} vào giỏ hàng`
                                : `Added ${paint.nameEn} to cart`
                            );
                          }}
                          className="btn-island bg-warm-900 hover:bg-warm-800 text-white text-[9px] xs:text-[10px] sm:text-[11px] px-2 py-1 gap-1 rounded-full flex items-center"
                        >
                          <span className="hidden xs:inline">{language === "vi" ? "Mua" : "Buy"}</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
