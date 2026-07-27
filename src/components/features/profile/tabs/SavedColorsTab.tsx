/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { PALETTE_COLORS } from "@/lib/color-utils";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Rule, TypographicLink } from "@/components/ui/editorial";
import type { ProfileColor } from "../types";

interface SavedColorsTabProps {
  language: string;
  wishlistColors: string[];
  handleToggleFavoriteColor: (code: string) => void;
  setSelectedColor: (color: ProfileColor) => void;
}

export function SavedColorsTab({
  language,
  wishlistColors,
  handleToggleFavoriteColor,
  setSelectedColor,
}: SavedColorsTabProps) {
  return (
    <section className="text-left">
      <h2 className="fl-display text-fl-xl">
        {language === "vi" ? "Màu sắc đã lưu" : "Saved Colors"}
      </h2>
      <Rule weight="strong" className="mt-fl-xs" />

      {wishlistColors.length > 0 ? (
        <div className="mt-fl-md grid grid-cols-2 gap-x-fl-sm gap-y-fl-md sm:grid-cols-3 md:grid-cols-4">
          {wishlistColors.map((code) => {
            const color = PALETTE_COLORS.find(c => c.code === code);
            if (!color) return null;
            return (
              <div key={color.code} className="group min-w-0">
                {/* Hard-edged chip, like a real paint chip (radius-swatch = 0). */}
                <button
                  onClick={() => setSelectedColor(color)}
                  aria-label={`${language === "vi" ? color.name : (color.nameEn || color.name)} (${color.code})`}
                  className="relative block h-24 w-full rounded-swatch border border-atelier-rule"
                >
                  <ColorSwatch color={color.hex} className="absolute inset-0 h-full w-full" />
                </button>
                <div className="mt-fl-2xs flex items-start justify-between gap-fl-2xs">
                  <div className="min-w-0">
                    <span className="fl-label block">{color.code}</span>
                    <button
                      onClick={() => setSelectedColor(color)}
                      className="block max-w-full truncate text-fl-sm font-medium text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:text-atelier-accent"
                    >
                      {language === "vi" ? color.name : (color.nameEn || color.name)}
                    </button>
                    <span className="block text-fl-xs tabular-nums text-atelier-ink-2">{color.hex}</span>
                  </div>
                  <button
                    onClick={() => handleToggleFavoriteColor(color.code)}
                    className="min-h-11 shrink-0 whitespace-nowrap text-fl-xs text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-danger md:min-h-6"
                  >
                    {language === "vi" ? "Bỏ lưu" : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-fl-lg text-fl-sm text-atelier-ink-2">
          <p>{language === "vi" ? "Bạn chưa lưu màu sắc nào." : "You have no saved colors."}</p>
          <div className="mt-fl-sm">
            <TypographicLink href="/colors" arrow="→">
              {language === "vi" ? "Khám phá bảng màu" : "Explore the palette"}
            </TypographicLink>
          </div>
        </div>
      )}
    </section>
  );
}
