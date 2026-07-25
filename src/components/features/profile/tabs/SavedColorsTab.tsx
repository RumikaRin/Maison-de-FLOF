"use client";

import Link from "next/link";
import { safeMotion } from "@/components/ui/motion-safe";
import { Heart } from "lucide-react";
import { PALETTE_COLORS } from "@/lib/color-utils";
import { ColorSwatch } from "@/components/ui/color-swatch";

interface SavedColorsTabProps {
  language: string;
  wishlistColors: string[];
  handleToggleFavoriteColor: (code: string) => void;
  setSelectedColor: (color: any) => void;
}

export function SavedColorsTab({
  language,
  wishlistColors,
  handleToggleFavoriteColor,
  setSelectedColor,
}: SavedColorsTabProps) {
  return (
    <safeMotion.div
      key="favorites"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm text-left">
        <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
          {language === "vi" ? "Màu sắc đã lưu" : "Saved Colors"}
        </h3>

        {wishlistColors.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {wishlistColors.map((code) => {
              const color = PALETTE_COLORS.find(c => c.code === code);
              if (!color) return null;
              return (
                <div
                  key={color.code}
                  onClick={() => setSelectedColor(color)}
                  className="bg-white rounded-2xl border border-warm-200 p-3 flex flex-col gap-3 group relative hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="h-24 rounded-xl border border-black/5 flex items-center justify-center relative shadow-inner overflow-hidden">
                    <ColorSwatch
                      color={color.hex}
                      className="absolute inset-0 h-full w-full"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoriteColor(color.code);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full shadow-sm text-rose-500 hover:scale-110 transition-all duration-200 flex items-center justify-center"
                      title={language === "vi" ? "Bỏ thích" : "Unlike"}
                    >
                      <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                    </button>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-warm-400 font-mono tracking-wider block">MÃ: {color.code}</span>
                    <h4 className="font-bold text-xs text-warm-900 truncate mt-0.5">
                      {language === "vi" ? color.name : (color.nameEn || color.name)}
                    </h4>
                    <span className="text-[10px] font-mono text-warm-550 block mt-0.5">{color.hex}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-10 text-warm-500 text-sm">
            {language === "vi" ? "Bạn chưa lưu màu sắc nào." : "You have no saved colors."}
            <div className="mt-4">
              <Link href="/colors" className="text-jotun-teal font-bold hover:underline">
                {language === "vi" ? "Khám phá bảng màu ngay" : "Explore Color Palette"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </safeMotion.div>
  );
}

