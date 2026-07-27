/* Hallmark · genre: editorial · section: colour explorer workspace · knobs: family selector=continuous colour field, stage=7/5, specs=F3 ledger · design-system: design.md · designed-as-app */
"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { safeMotion, AnimatePresence, useReducedMotion } from "@/components/ui/motion-safe";
import { Heart } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { cn, formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { toast } from "@/components/ui/csp-toast";
import { COLOR_FAMILIES, COLOR_SWATCHES, FAMILY_METADATA } from "@/lib/constants/home-data";
import { Paint, PaintColor } from "@/types";
import { ColorSwatch } from "@/components/ui/color-swatch";
import {
  EditorialSection,
  Rule,
  SpecLedger,
  TypographicLink,
} from "@/components/ui/editorial";

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
  commerceAvailable: boolean;
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
  commerceAvailable,
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

  const meta = FAMILY_METADATA[currentSwatch.family];
  const rooms = (language === "vi" ? meta?.roomsVi : meta?.roomsEn) ?? [];

  return (
    <EditorialSection
      rhythm="base"
      frame
      className="fl-rise bg-atelier-paper"
      id="color-explorer-section"
      data-fl-io
    >
      {/* Section head — label stacked above the heading, link on the baseline */}
      <div className="flex flex-col gap-fl-sm md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="fl-label">{language === "vi" ? "Bảng màu" : "Palette"}</p>
          <div className="fl-mask-line mt-fl-xs">
            <h2 className="fl-display text-fl-3xl text-atelier-ink">
              {language === "vi"
                ? "Duyệt màu theo không khí"
                : "Browse colour by atmosphere"}
            </h2>
          </div>
          <p className="fl-measure-tight mt-fl-sm text-fl-sm text-atelier-ink-2">
            {language === "vi"
              ? "Chọn nhóm màu, xem trên phòng mẫu, lưu yêu thích và chọn sản phẩm phù hợp."
              : "Pick a family, preview on a sample room, save favourites, and match products."}
          </p>
        </div>
        <TypographicLink href="/colors" className="shrink-0">
          {language === "vi" ? "Xem toàn bộ bảng màu" : "Full colour catalogue"}
        </TypographicLink>
      </div>

      {/* Family selector — one continuous colour field, not tabs in a card.
          Each cell IS its colour; the selected cell grows and carries a rule. */}
      <div
        role="group"
        aria-label={language === "vi" ? "Chọn nhóm màu" : "Colour families"}
        className="fl-stagger mt-fl-lg flex items-end gap-fl-3xs overflow-x-auto no-scrollbar"
      >
        {COLOR_FAMILIES.map((family) => {
          const isSelected = selectedFamily === family.id;
          return (
            <button
              key={family.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedFamily(family.id);
                const first = COLOR_SWATCHES.find((c) => c.family === family.id);
                if (first) setVisWallMainColor(first.hex);
              }}
              className="group flex min-w-[96px] flex-1 flex-col text-left"
            >
              <ColorSwatch
                color={family.hex}
                className={cn(
                  "fl-swatch w-full rounded-swatch transition-[height] duration-fl-base ease-fl-out",
                  isSelected ? "h-20" : "h-12 group-hover:h-16",
                )}
              />
              <span
                className={cn(
                  "mt-fl-2xs block border-t pr-fl-2xs pt-fl-2xs text-fl-xs",
                  isSelected
                    ? "border-atelier-ink font-medium text-atelier-ink"
                    : "border-transparent text-atelier-ink-2",
                )}
              >
                {language === "vi" ? family.name : family.nameEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workspace — room stage (7) + shade index (5), one coordinated unit */}
      <div className="mt-fl-lg grid grid-cols-1 items-start gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2 sm:aspect-[16/10]">
            {/* State crossfade — motion primitive 2 of 2 for this page */}
            <AnimatePresence mode="wait">
              <safeMotion.div
                key={`${selectedFamily}-${visWallMainColor}`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.24 }}
                className="absolute inset-0"
              >
                <Image
                  src={roomImageForFamily(selectedFamily)}
                  alt={language === "vi" ? "Mô phỏng phòng khách" : "Living room preview"}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
                <ColorSwatch
                  color={visWallMainColor}
                  opacity={0.28}
                  className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply"
                />
              </safeMotion.div>
            </AnimatePresence>
          </div>

          {/* Caption under the plate, editorial-figure style — no floating chip */}
          <div className="flex flex-wrap items-baseline justify-between gap-fl-2xs border-b border-atelier-rule py-fl-xs">
            <p className="text-fl-sm text-atelier-ink">
              {language === "vi"
                ? `Phòng khách · ${familyMeta?.name || ""}`
                : `Living room · ${familyMeta?.nameEn || ""}`}
            </p>
            <p className="fl-label">
              {language === "vi" ? currentSwatch.name : currentSwatch.nameEn} · #
              {currentSwatch.code}
            </p>
          </div>

          {/* Colour specification — flat ledger, keyed to the selected shade */}
          <SpecLedger
            className="mt-fl-sm border-t-0"
            columns={4}
            rows={[
              { label: "HEX", value: currentSwatch.hex.toUpperCase() },
              { label: "RGB", value: hexToRgb(currentSwatch.hex) },
              {
                label: language === "vi" ? "Phong cách" : "Style",
                value:
                  (language === "vi" ? meta?.styleVi : meta?.styleEn) ||
                  (language === "vi" ? "Hiện đại" : "Modern"),
              },
              {
                label: language === "vi" ? "Không gian" : "Spaces",
                value: rooms.length ? rooms.join(", ") : "—",
              },
            ]}
          />
        </div>

        {/* Shade index for the family */}
        <div className="lg:col-span-5">
          <p className="fl-label">
            {language === "vi"
              ? `Mã màu · ${familyMeta?.name || ""}`
              : `Shades · ${familyMeta?.nameEn || ""}`}
          </p>
          <AnimatePresence mode="wait">
            <safeMotion.div
              key={selectedFamily}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.24 }}
              // safeMotion exposes no `ul`, so the wrapper is a div carrying
              // list semantics — otherwise its <li> children are orphaned.
              role="list"
              className="fl-stagger mt-fl-sm grid grid-cols-2 gap-x-fl-sm sm:grid-cols-3"
            >
              {(filteredSwatches.length ? filteredSwatches : COLOR_SWATCHES.slice(0, 6)).map(
                (swatch) => {
                  const isFav = wishlist.includes(swatch.code);
                  const isActive = visWallMainColor === swatch.hex;
                  return (
                    <li key={swatch.code} className="relative flex flex-col border-b border-atelier-rule pb-fl-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setVisWallMainColor(swatch.hex);
                          toast.success(
                            language === "vi"
                              ? `Đã chọn màu ${swatch.name}`
                              : `Selected ${swatch.nameEn || swatch.name}`,
                          );
                        }}
                        aria-pressed={isActive}
                        aria-label={
                          language === "vi"
                            ? `Chọn màu ${swatch.name}`
                            : `Select ${swatch.nameEn || swatch.name}`
                        }
                        className="flex min-w-0 flex-col gap-fl-2xs pt-fl-xs text-left"
                      >
                        <ColorSwatch
                          color={swatch.hex}
                          className={cn(
                            "h-14 w-full rounded-swatch transition-shadow duration-fl-fast ease-fl-out",
                            isActive ? "fl-swatch-selected" : "fl-swatch",
                          )}
                        />
                        <span className="truncate text-fl-sm text-atelier-ink">
                          {language === "vi" ? swatch.name : swatch.nameEn}
                        </span>
                        <span className="fl-label">#{swatch.code}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(swatch.code)}
                        aria-pressed={isFav}
                        aria-label={
                          language === "vi"
                            ? `Yêu thích màu ${swatch.name}`
                            : `Favourite ${swatch.nameEn || swatch.name}`
                        }
                        className="absolute right-fl-2xs top-fl-sm flex h-8 w-8 items-center justify-center rounded-control bg-atelier-paper/90 text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-danger"
                      >
                        <Heart
                          className={cn(
                            "h-3.5 w-3.5",
                            isFav && "fill-[var(--fl-danger)] text-atelier-danger",
                          )}
                        />
                      </button>
                    </li>
                  );
                },
              )}
            </safeMotion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Suggested products — dense catalogue rhythm on hairlines, no card boxes */}
      <div className="mt-fl-2xl">
        <div className="flex flex-wrap items-end justify-between gap-fl-sm">
          <h3 className="fl-display text-fl-2xl text-atelier-ink">
            {language === "vi"
              ? `Sơn phù hợp tông ${familyMeta?.name || ""}`
              : `Paints for ${familyMeta?.nameEn || ""} tones`}
          </h3>
          <TypographicLink href="/products">
            {language === "vi" ? "Tất cả sản phẩm" : "All products"}
          </TypographicLink>
        </div>
        <Rule className="mt-fl-xs" weight="strong" />

        <div className="no-scrollbar -mx-1 flex snap-x gap-fl-md overflow-x-auto px-1 md:mx-0 md:grid md:grid-cols-4 md:gap-fl-lg md:overflow-visible md:px-0">
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
                className="flex w-[70vw] max-w-[260px] shrink-0 snap-start flex-col pt-fl-sm md:w-auto md:max-w-none"
              >
                <Link
                  href={`/products/${paint.slug}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2"
                >
                  <Image
                    src={getProductImage(paint.images)}
                    alt={paint.name}
                    fill
                    sizes="(min-width: 768px) 22vw, 70vw"
                    className="object-contain p-fl-xs"
                  />
                </Link>
                <Link href={`/products/${paint.slug}`} className="mt-fl-xs block">
                  <p className="fl-label">{paint.supplier?.name || "Maison de FLOF"}</p>
                  <h4 className="mt-0.5 truncate font-serif text-fl-md text-atelier-ink">
                    {language === "vi" ? paint.name : paint.nameEn}
                  </h4>
                </Link>
                <div className="mt-auto flex items-baseline justify-between gap-fl-2xs border-t border-atelier-rule pt-fl-xs">
                  {paint.discountPercent && paint.discountPercent > 0 ? (
                    <span className="flex flex-col">
                      <span className="text-fl-sm tabular-nums text-atelier-danger">
                        {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                        <span className="ml-1 text-fl-2xs">−{paint.discountPercent}%</span>
                      </span>
                      <span className="text-fl-xs tabular-nums text-atelier-ink-3 line-through">
                        {formatPrice(paint.price)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-fl-sm tabular-nums text-atelier-ink">
                      {formatPrice(paint.price)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!commerceAvailable) return;
                      addItem(paint, 1, defaultColorObj);
                      toast.success(
                        language === "vi"
                          ? `Đã thêm ${paint.name} vào giỏ hàng`
                          : `Added ${paint.nameEn} to cart`,
                      );
                    }}
                    disabled={!commerceAvailable}
                    aria-disabled={!commerceAvailable}
                    className="min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 disabled:cursor-not-allowed disabled:opacity-45 md:min-h-6"
                  >
                    {language === "vi" ? "Thêm vào giỏ" : "Add to cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </EditorialSection>
  );
}
