"use client";

import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { TypographicLink, CascadeText } from "@/components/ui/editorial";

export function HeroContent() {
  const { language } = useLanguageStore();

  return (
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
  );
}

export function HeroMetadataBar() {
  const { language } = useLanguageStore();

  return (
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
  );
}
