/* Hallmark · genre: editorial · section: visualizer promo · knobs: drench=sage, stage=large single, benefits=text ledger (no icon cards) · design-system: design.md · designed-as-app */ "use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { DrenchBand, Rule, TypographicLink } from "@/components/ui/editorial";
import { SliceImage } from "@/components/ui/slice-image";
import { cn } from "@/lib/utils";

const ROOMS = [
  { src: "/living_sage.webp", labelVi: "Phòng khách", labelEn: "Living" },
  { src: "/bedroom_beige.webp", labelVi: "Phòng ngủ", labelEn: "Bedroom" },
  { src: "/kitchen_grey.webp", labelVi: "Phòng bếp", labelEn: "Kitchen" },
  { src: "/facade_p5.webp", labelVi: "Mặt tiền", labelEn: "Facade" },
];

/**
 * Visualizer promo — the section itself is drenched in a real paint colour,
 * so the page demonstrates the product instead of describing it. Benefits are
 * a compact text ledger on hairlines, not three equal icon cards.
 */
export function VisualizerPromoSection() {
  const { language } = useLanguageStore();

  const benefits = [
    {
      labelVi: "Không gian mẫu",
      labelEn: "Sample rooms",
      valueVi: "Phòng khách, ngủ, bếp và mặt tiền",
      valueEn: "Living, bedroom, kitchen and facade",
    },
    {
      labelVi: "Đổi màu",
      labelEn: "Recolour",
      valueVi: "Chạm swatch, tường đổi màu tức thì",
      valueEn: "Tap a swatch, walls recolour instantly",
    },
    {
      labelVi: "Thiết bị",
      labelEn: "Devices",
      valueVi: "Điện thoại hoặc máy tính, không cần app",
      valueEn: "Phone or desktop, no app install",
    },
  ];

  return (
    <DrenchBand
      color="sage"
      id="visualizer-section"
      className="fl-rise fl-band-grow relative py-fl-3xl md:py-fl-4xl"
    >
      <div
        className="fl-orn-blueprint relative mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]"
        data-fl-io
      >
        <div className="grid grid-cols-1 items-start gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
          {/* Copy column — 4 of 12 */}
          <div className="lg:col-span-4">
            <p className="fl-label">
              {language === "vi" ? "Công cụ số" : "Digital tool"}
            </p>
            <div className="fl-mask-line mt-fl-xs">
              <h2 className="fl-display text-fl-display-s">
                {language === "vi"
                  ? "Thử màu trong phòng thật"
                  : "Test colour in a real room"}
              </h2>
            </div>
            <p className="fl-measure-tight mt-fl-md text-fl-md ">
              {language === "vi"
                ? "Thử màu sơn trên không gian mẫu trước khi mua. Tìm tone phù hợp chỉ bằng vài thao tác."
                : "Preview paint on sample rooms before you buy. Find the right tone in a few taps."}
            </p>

            {/* Benefits — compact text ledger */}
            <dl className="fl-stagger mt-fl-lg">
              {benefits.map((benefit) => (
                <div
                  key={benefit.labelEn}
                  className="grid grid-cols-[7rem_1fr] gap-fl-sm border-t border-atelier-rule-on-dark py-fl-xs"
                >
                  <dt className="fl-label">
                    {language === "vi" ? benefit.labelVi : benefit.labelEn}
                  </dt>
                  <dd className="text-fl-sm ">
                    {language === "vi" ? benefit.valueVi : benefit.valueEn}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-fl-lg flex flex-wrap items-center gap-fl-md">
              {/* On a drench the primary action flips to the band ink — teal is invisible here */}
              <Link
                href="/color-visualizer"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-control bg-atelier-on-dark px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-espresso transition-opacity duration-fl-fast ease-fl-out hover:opacity-90 md:min-h-10"
              >
                {language === "vi" ? "Mở visualizer" : "Open the visualizer"}
              </Link>
              <TypographicLink href="/colors">
                {language === "vi" ? "Xem bảng màu" : "Browse colours"}
              </TypographicLink>
            </div>
          </div>

          {/* Stage column — 8 of 12, one large room stage */}
          <div className="lg:col-span-8">
            <Link
              href="/color-visualizer"
              className="block overflow-hidden rounded-surface"
            >
              <span className="relative block aspect-[16/10] w-full">
                <SliceImage
                  src="/visualizer_mockup.webp"
                  alt={
                    language === "vi"
                      ? "Giao diện công cụ phối màu"
                      : "Colour visualizer interface"
                  }
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              </span>
            </Link>

            {/* Restrained controls — the four rooms as an editorial index row */}
            <div className="fl-mosaic mt-fl-sm grid grid-cols-2 gap-fl-sm sm:grid-cols-4">
              {ROOMS.map((room, index) => (
                <Link
                  key={room.src}
                  href="/color-visualizer"
                  className="group flex flex-col"
                >
                  <span
                    className={cn(
                      "relative block aspect-[4/3] w-full overflow-hidden rounded-surface",
                      index % 2 === 0 ? "fl-curtain-u" : "fl-curtain-l",
                    )}
                  >
                    <Image
                      src={room.src}
                      alt={language === "vi" ? room.labelVi : room.labelEn}
                      fill
                      sizes="(min-width: 640px) 15vw, 45vw"
                      className="object-cover transition-transform duration-fl-slow ease-fl-out group-hover:scale-[1.03] motion-reduce:transform-none"
                    />
                  </span>
                  <span className="mt-fl-2xs flex min-h-11 items-start border-t border-atelier-rule-on-dark pt-fl-2xs text-fl-xs transition-opacity duration-fl-fast ease-fl-out group-hover:opacity-100 md:min-h-6">
                    {language === "vi" ? room.labelVi : room.labelEn}
                  </span>
                </Link>
              ))}
            </div>

            <Rule className="mt-fl-lg" />
            <p className="mt-fl-xs text-fl-sm ">
              {language === "vi"
                ? "Nền của khối này là màu Xanh Rêu #8002 — một màu sơn thật trong bảng màu FLOF."
                : "This section is painted in Moss Green #8002 — a real shade from the FLOF range."}
            </p>
          </div>
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 420 128"
          className="pointer-events-none absolute bottom-fl-md right-[clamp(1rem,4vw,1.5rem)] hidden w-72 xl:block"
        >
          <path
            className="fl-draw"
            d="M 90 100 L 90 30 L 250 30 L 250 100 M 90 100 L 330 100 M 250 62 A 26 26 0 0 1 276 88 M 140 30 L 140 22 M 180 30 L 180 22 M 220 30 L 220 22"
            fill="none"
            stroke="var(--fl-rule-on-dark)"
            strokeWidth="1"
          />
        </svg>
      </div>
    </DrenchBand>
  );
}
