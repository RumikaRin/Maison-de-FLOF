import { Heart, X } from "lucide-react";
import { useTrans } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import {
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  hexToRgb,
  hexToHsl
} from "@/lib/color-utils";

interface ColorDetailDrawerProps {
  selectedColor: {
    code: string;
    name: string;
    nameEn?: string;
    hex: string;
  } | null;
  onClose: () => void;
  favorites: string[];
  onToggleFavorite: (code: string) => void;
  language: "vi" | "en";
}

export function ColorDetailDrawer({
  selectedColor,
  onClose,
  favorites,
  onToggleFavorite,
  language
}: ColorDetailDrawerProps) {
  const t = useTrans(language);

  if (!selectedColor) return null;

  const compColor = getComplementaryColors(selectedColor.hex)[0];
  const analogous = getAnalogousColors(selectedColor.hex);
  const triadic = getTriadicColors(selectedColor.hex);
  const rgb = hexToRgb(selectedColor.hex);
  const rgbVal = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  const hsl = hexToHsl(selectedColor.hex);
  const hslVal = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;

  const isFav = favorites.includes(selectedColor.code);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-l border-warm-200/80 w-full max-w-lg h-screen pt-20 pb-8 px-8 flex flex-col gap-6 overflow-y-auto relative shadow-2xl text-left animate-fade-in-up animate-out-expo"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-6 h-9 w-9 rounded-full border border-warm-200 hover:bg-warm-100 flex items-center justify-center transition-all text-warm-700 hover:scale-105"
          title={language === "vi" ? "Đóng" : "Close"}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Swatch Display */}
        <div
          className="h-52 w-full rounded-2xl border border-black/5 flex flex-col justify-end p-6 relative shadow-inner mt-2 overflow-hidden"
          style={{ backgroundColor: selectedColor.hex }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-2xl" />
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <span className="text-[11px] font-mono tracking-wider text-white/80">#{selectedColor.code}</span>
              <h2 className="text-2xl font-bold font-serif mt-1 text-white">
                {language === "vi" ? selectedColor.name : (selectedColor.nameEn || selectedColor.name)}
              </h2>
            </div>
            <button
              onClick={() => onToggleFavorite(selectedColor.code)}
              className="bg-white/95 hover:bg-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-warm-900 text-xs font-bold transition-all duration-300 shadow-sm"
            >
              <Heart className={cn("h-3.5 w-3.5 transition-colors", isFav ? "fill-rose-500 text-rose-500" : "text-warm-400")} />
              <span>{isFav ? (language === "vi" ? "Đã thích" : "Liked") : t.addToFavorites}</span>
            </button>
          </div>
        </div>

        {/* Color Codes SECTION */}
        <div className="grid grid-cols-3 gap-4 border-y border-warm-200 py-4">
          <div>
            <span className="block text-[10px] text-warm-400 uppercase font-bold tracking-wider mb-1">Hex</span>
            <span className="font-mono text-sm font-semibold text-warm-900">{selectedColor.hex}</span>
          </div>
          <div>
            <span className="block text-[10px] text-warm-400 uppercase font-bold tracking-wider mb-1">RGB</span>
            <span className="font-mono text-sm font-semibold text-warm-900">{rgbVal}</span>
          </div>
          <div>
            <span className="block text-[10px] text-warm-400 uppercase font-bold tracking-wider mb-1">HSL</span>
            <span className="font-mono text-sm font-semibold text-warm-900">{hslVal}</span>
          </div>
        </div>

        {/* Complementary Colors */}
        <div>
          <h3 className="font-serif font-bold text-lg mb-4 text-warm-900">
            {t.complementaryColors}
          </h3>

          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-warm-200 mb-4 shadow-xs">
            <div
              className="h-14 w-14 rounded-xl border border-black/5 shrink-0"
              style={{ backgroundColor: compColor }}
            />
            <div>
              <span className="text-xs text-warm-500 font-semibold block mb-0.5">
                {language === "vi" ? "Màu tương phản (180°)" : "Complementary (180°)"}
              </span>
              <span className="font-mono text-sm font-bold text-warm-900">{compColor}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">{t.analogousColors}</h4>
              <div className="grid grid-cols-2 gap-3">
                {analogous.map((hex, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white border border-warm-200 rounded-xl shadow-xs hover:border-[#88734C]/20 transition-all duration-200">
                    <div className="h-9 w-9 rounded-lg border border-black/5" style={{ backgroundColor: hex }} />
                    <span className="font-mono text-xs font-bold text-warm-850">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">{t.triadicColors}</h4>
              <div className="grid grid-cols-2 gap-3">
                {triadic.map((hex, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white border border-warm-200 rounded-xl shadow-xs hover:border-[#88734C]/20 transition-all duration-200">
                    <div className="h-9 w-9 rounded-lg border border-black/5" style={{ backgroundColor: hex }} />
                    <span className="font-mono text-xs font-bold text-warm-850">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility */}
        <div className="p-4 border border-[#88734C]/20 bg-[#88734C]/5 rounded-xl flex gap-3 text-xs text-warm-850">
          <div>
            <h4 className="font-bold mb-0.5">
              ✓ {language === "vi" ? "Tương thích pha màu tự động" : "Auto tinting compatible"}
            </h4>
            <p className="leading-relaxed opacity-90">
              {language === "vi"
                ? "Mã màu này được lập trình cho máy pha sơn tự động của Maison de FLOF, sử dụng cho Majestic và Jotashield."
                : "This color code is programmed for Maison de FLOF automatic tinting machines for Majestic and Jotashield."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
