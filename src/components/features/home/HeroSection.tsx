/* Hallmark · genre: editorial · section: H6 Photographic fold · knobs: image=full-bleed 72vh, caption=lower-left, text=left-bias · design-system: design.md · designed-as-app */
"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { safeMotion, useReducedMotion } from "@/components/ui/motion-safe";
import { useLanguageStore } from "@/store/language-store";
import { TypographicLink, CascadeText } from "@/components/ui/editorial";

/**
 * H6 Photographic fold — the room photograph is the hero. Text sits on it,
 * left-biased, never centred. Deliberately NOT full viewport height so the
 * product editorial below stays reachable (design spec § Hero).
 *
 * The load fade below is motion primitive 1 of 2 for the whole page.
 */
export function HeroSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  return (
    <>
    <section className="fl-photo-fold fl-photo-plate flex min-h-[560px] w-full items-end overflow-hidden bg-atelier-espresso md:h-[72vh] md:max-h-[780px]">
      {/* Full-bleed media — the one hero load transition the system allows */}
      <safeMotion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/generated/hero-cinematic.jpg"
          alt={
            language === "vi"
              ? "Không gian sống với màu sơn cao cấp"
              : "Living space with premium paint"
          }
          fill
          priority
          // The source is 1280x720. Quality 92 stops next/image adding its own
          // softness on top of an asset that is already below 2x for this fold.
          quality={92}
          sizes="100vw"
          // Soft fold: the source is only 1280x720, so the scroll-out relaxes
          // from 1.12 scale to rest — scale-only, because a translate at
          // scale 1.0 would expose the plate edge.
          className="fl-photo-zoomout fl-photo-zoomout-soft object-cover object-center"
        />
        {/* Legibility scrim, bottom-left weighted like a printed caption field */}
        <div aria-hidden="true" className="fl-photo-scrim" />
      </safeMotion.div>

      <div className="relative z-10 mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] pb-fl-xl pt-fl-4xl md:pb-fl-2xl">
        <div className="fl-hero-cascade max-w-2xl text-left text-atelier-on-dark">
          <p className="fl-label">Maison de FLOF</p>

          <h1 className="fl-display fl-cascade-skip mt-fl-xs text-fl-display text-atelier-on-dark">
            <CascadeText
              text={
                language === "vi"
                  ? "Màu sơn cho\nngôi nhà Việt"
                  : "Colour for\nVietnamese homes"
              }
            />
          </h1>

          <p className="fl-measure-tight mt-fl-md text-fl-md text-atelier-on-dark">
            {language === "vi"
              ? "Hơn 1000 sắc. Phối trên phòng mẫu. Mua online hoặc qua đại lý ủy quyền."
              : "1000+ shades. Preview on real rooms. Shop online or visit a dealer."}
          </p>

          <div className="mt-fl-lg flex flex-wrap items-center gap-fl-md">
            <Link
              href="/colors"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-accent-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-accent-hover md:min-h-10"
            >
              {language === "vi" ? "Khám phá bảng màu" : "Explore the colours"}
            </Link>
            <TypographicLink
              href="/color-visualizer"
              className="!text-atelier-on-dark"
            >
              {language === "vi" ? "Thử màu trong phòng" : "Try a room"}
            </TypographicLink>
          </div>

        </div>
      </div>
    </section>

    {/* Plate line — the fold's technical metadata as its own hairline strip on
        paper, the way an architectural drawing carries its title block under
        the plate. Real facts only, never numbered (design.md § Notes). */}
    <div className="border-b border-atelier-rule bg-atelier-paper">
      <div
        data-fl-io
        className="fl-stagger mx-auto flex w-full max-w-[100rem] flex-col gap-fl-2xs px-[clamp(1rem,4vw,1.5rem)] py-fl-sm lg:flex-row lg:items-center lg:justify-between"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 44 44"
          className="fl-orn-fade hidden h-5 w-5 shrink-0 text-atelier-ink-3 lg:block"
        >
          <line x1="22" y1="4" x2="22" y2="40" stroke="currentColor" strokeWidth="1" />
          <line x1="4" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="1" />
          <circle cx="22" cy="22" r="9" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
        <span className="fl-label">
          {language === "vi" ? "1000+ mã màu" : "1000+ colour codes"}
        </span>
        <span className="fl-label">
          {language === "vi" ? "Visualizer phòng mẫu" : "Room visualizer"}
        </span>
        <span className="fl-label">
          {language === "vi" ? "Đại lý toàn quốc" : "Nationwide dealers"}
        </span>
        <span className="fl-label hidden xl:inline">21.0405° B · 105.8342° Đ</span>
      </div>
    </div>
    </>
  );
}
