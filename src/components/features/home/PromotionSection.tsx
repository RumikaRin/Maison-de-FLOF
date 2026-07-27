/* Hallmark · genre: editorial · section: product editorial · knobs: split=7/5 image-dominant, swatch rail crosses boundary, ledger=F3 2-col · design-system: design.md · designed-as-app */
"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import {
  EditorialSection,
  SpecLedger,
  SwatchChip,
  TypographicLink,
} from "@/components/ui/editorial";
import { COLOR_SWATCHES } from "@/lib/constants/home-data";

/** The four shades the rail shows against the Majestic story. Existing catalogue data. */
const RAIL_CODES = ["7686", "2002", "3004", "8002"];

/**
 * Product editorial — the right shade for every surface. Image-dominant 7/5
 * asymmetric split; a physical swatch rail crosses the image/text boundary so
 * the two planes read as one composed spread, not a 50/50 template.
 */
export function PromotionSection() {
  const { language } = useLanguageStore();
  const rail = COLOR_SWATCHES.filter((swatch) => RAIL_CODES.includes(swatch.code));

  return (
    <EditorialSection rhythm="generous" frame className="fl-rise bg-atelier-paper" data-fl-io>
      <div className="grid grid-cols-1 items-start gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
        {/* Image plane — 7 columns, the dominant plate */}
        <figure className="relative lg:col-span-7">
          <svg
            aria-hidden="true"
            viewBox="0 0 200 160"
            className="fl-orn-arc pointer-events-none absolute -left-fl-lg -top-fl-lg hidden w-40 lg:block"
          >
            <circle className="fl-draw fl-draw-outer" cx="96" cy="80" r="48" fill="none" stroke="var(--fl-drench-clay)" strokeWidth="1.2" />
            <circle className="fl-draw fl-draw-inner" cx="124" cy="80" r="33" fill="none" stroke="var(--fl-rule-strong)" strokeWidth="1" />
          </svg>
          <div className="fl-photo-plate fl-curtain-l relative aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2">
            <Image
              src="/product_interior.webp"
              alt={
                language === "vi"
                  ? "Sơn nội thất Majestic trong phòng khách"
                  : "Majestic interior paint in a living room"
              }
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="fl-photo-parallax object-cover"
            />
          </div>
          <figcaption className="fl-label mt-fl-2xs">
            {language === "vi" ? "Majestic · Sơn nội thất" : "Majestic · Interior paint"}
          </figcaption>

          {/* Swatch rail — crosses the image/text boundary on desktop; folds
              into an in-flow row on mobile (design.md § Responsive). The
              samples sit above the page plane, the one place shadow belongs. */}
          <div className="fl-stagger mt-fl-md flex gap-fl-xs lg:absolute lg:-right-fl-xl lg:top-fl-xl lg:mt-0 lg:w-fl-4xl lg:flex-col lg:bg-atelier-paper lg:p-fl-2xs lg:shadow-[0_10px_30px_rgb(0_0_0/0.12)]">
            {rail.map((swatch) => (
              <SwatchChip
                key={swatch.code}
                hex={swatch.hex}
                name={language === "vi" ? swatch.name : swatch.nameEn}
                code={swatch.code}
                layout="chip"
                className="lg:h-12 lg:w-full"
              />
            ))}
          </div>
        </figure>

        {/* Copy plane — 5 columns, offset below the image top for asymmetry */}
        <div className="flex flex-col items-start lg:col-span-5 lg:mt-fl-2xl lg:pl-fl-xl">
          <p className="fl-label">
            {language === "vi" ? "Dòng nổi bật" : "Featured line"}
          </p>

          <div className="fl-mask-line mt-fl-xs">
            <h2 className="fl-display text-fl-display-s text-atelier-ink">
              {language === "vi"
                ? "Đúng sắc cho từng bề mặt"
                : "The right shade for every surface"}
            </h2>
          </div>

          <p className="fl-measure-tight mt-fl-md text-fl-md text-atelier-ink-2">
            {language === "vi"
              ? "Majestic là sơn nội thất cao cấp cho tường trong nhà: màu rực rỡ, dễ lau chùi, bề mặt bền đẹp qua nhiều năm sử dụng."
              : "Majestic is a premium interior paint: vivid colour, easy to wipe clean, and a finish that holds up year after year."}
          </p>

          {/* Flat specification ledger — data the story already carries */}
          <SpecLedger
            className="fl-stagger mt-fl-lg w-full"
            columns={2}
            rows={[
              {
                label: language === "vi" ? "Bề mặt" : "Surface",
                value: language === "vi" ? "Tường nội thất" : "Interior walls",
              },
              {
                label: language === "vi" ? "Không gian" : "Space",
                value:
                  language === "vi"
                    ? "Phòng khách, phòng ngủ"
                    : "Living rooms, bedrooms",
              },
              {
                label: language === "vi" ? "Đặc tính" : "Character",
                value: language === "vi" ? "Dễ lau chùi, màu sắc nét" : "Washable, true colour",
              },
              {
                label: language === "vi" ? "Độ bền" : "Durability",
                value: language === "vi" ? "Màng sơn bền bề mặt" : "Durable paint film",
              },
            ]}
          />

          <div className="mt-fl-lg flex flex-wrap items-center gap-fl-lg">
            <TypographicLink href="/products">
              {language === "vi" ? "Xem sản phẩm" : "View products"}
            </TypographicLink>
            <TypographicLink href="/quote-request">
              {language === "vi" ? "Tư vấn báo giá" : "Request a quote"}
            </TypographicLink>
          </div>
        </div>
      </div>
    </EditorialSection>
  );
}
