import { Heart, X } from "lucide-react";
import { useTrans } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "@/components/ui/color-swatch";
import {
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  hexToRgb,
  hexToHsl,
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
      // Scrim dims only — no blur (design.md § Shape and depth).
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/45"
    >
      {/* An open drawer visibly floats above the page — one of the two surfaces
          design.md allows a shadow on. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-screen w-full max-w-lg flex-col gap-fl-md overflow-y-auto border-l border-atelier-rule bg-atelier-paper px-fl-lg pb-fl-lg pt-20 text-left shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-fl-sm top-fl-sm flex h-11 w-11 items-center justify-center rounded-control border border-atelier-rule text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 hover:text-atelier-ink md:h-10 md:w-10"
          title={language === "vi" ? "Đóng" : "Close"}
        >
          <X className="h-4 w-4" />
        </button>

        {/* The paint sample: hard-edged, full-bleed to the drawer measure, and
            the one element here that carries a shadow. Name and code sit under
            it on paper so contrast never depends on the paint value. */}
        <div>
          <ColorSwatch
            color={selectedColor.hex}
            className="fl-swatch block h-52 w-full rounded-swatch"
          />
          <div className="mt-fl-sm flex items-end justify-between gap-fl-sm">
            <div>
              <span className="fl-label block">#{selectedColor.code}</span>
              <h2 className="fl-display mt-fl-3xs text-fl-2xl text-atelier-ink">
                {language === "vi" ? selectedColor.name : (selectedColor.nameEn || selectedColor.name)}
              </h2>
            </div>
            <button
              onClick={() => onToggleFavorite(selectedColor.code)}
              className="flex min-h-11 shrink-0 items-center gap-fl-2xs rounded-control border border-atelier-rule-strong px-fl-xs py-fl-3xs text-fl-sm font-medium text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 md:min-h-10"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors duration-fl-fast ease-fl-out",
                  isFav ? "fill-current text-atelier-accent" : "text-atelier-ink-3",
                )}
              />
              <span>{isFav ? (language === "vi" ? "Đã thích" : "Liked") : t.addToFavorites}</span>
            </button>
          </div>
        </div>

        {/* Color Codes SECTION — technical metadata ledger */}
        <div className="grid grid-cols-3 gap-fl-sm border-y border-atelier-rule py-fl-sm">
          <div>
            <span className="fl-label mb-fl-3xs block">Hex</span>
            <span className="text-fl-sm tabular-nums text-atelier-ink">{selectedColor.hex}</span>
          </div>
          <div>
            <span className="fl-label mb-fl-3xs block">RGB</span>
            <span className="text-fl-sm tabular-nums text-atelier-ink">{rgbVal}</span>
          </div>
          <div>
            <span className="fl-label mb-fl-3xs block">HSL</span>
            <span className="text-fl-sm tabular-nums text-atelier-ink">{hslVal}</span>
          </div>
        </div>

        {/* Complementary Colors */}
        <div>
          <h3 className="fl-display text-fl-xl text-atelier-ink">
            {t.complementaryColors}
          </h3>

          <div className="mt-fl-sm flex items-center gap-fl-sm">
            <ColorSwatch
              color={compColor}
              className="fl-swatch block h-14 w-14 shrink-0 rounded-swatch"
            />
            <div>
              <span className="block text-fl-sm text-atelier-ink-2">
                {language === "vi" ? "Màu tương phản (180°)" : "Complementary (180°)"}
              </span>
              <span className="mt-fl-3xs block text-fl-sm tabular-nums text-atelier-ink">{compColor}</span>
            </div>
          </div>

          <div className="mt-fl-md flex flex-col gap-fl-md">
            <div>
              <h4 className="fl-label mb-fl-2xs block border-t border-atelier-rule pt-fl-2xs">{t.analogousColors}</h4>
              <div className="grid grid-cols-2 gap-fl-xs">
                {analogous.map((hex, i) => (
                  <div key={i} className="flex items-center gap-fl-2xs">
                    <ColorSwatch
                      color={hex}
                      className="fl-swatch block h-9 w-9 shrink-0 rounded-swatch"
                    />
                    <span className="text-fl-sm tabular-nums text-atelier-ink">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="fl-label mb-fl-2xs block border-t border-atelier-rule pt-fl-2xs">{t.triadicColors}</h4>
              <div className="grid grid-cols-2 gap-fl-xs">
                {triadic.map((hex, i) => (
                  <div key={i} className="flex items-center gap-fl-2xs">
                    <ColorSwatch
                      color={hex}
                      className="fl-swatch block h-9 w-9 shrink-0 rounded-swatch"
                    />
                    <span className="text-fl-sm tabular-nums text-atelier-ink">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility — a hairline rule carries the boundary, not a card. */}
        <div className="border-t border-atelier-rule pt-fl-sm text-fl-sm text-atelier-ink-2">
          <h4 className="font-medium text-atelier-ink">
            ✓ {language === "vi" ? "Tương thích pha màu tự động" : "Auto tinting compatible"}
          </h4>
          <p className="mt-fl-3xs">
            {language === "vi"
              ? "Mã màu này được lập trình cho máy pha sơn tự động của Maison de FLOF, sử dụng cho Majestic và Jotashield."
              : "This color code is programmed for Maison de FLOF automatic tinting machines for Majestic và Jotashield."}
          </p>
        </div>
      </div>
    </div>
  );
}
