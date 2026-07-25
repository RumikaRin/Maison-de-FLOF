"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

/**
 * Cinematic full-bleed hero (Aura-style immersion)
 * + clear dual CTAs (product-site clarity from coffee/ecom landings).
 */
export function HeroSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full min-h-[100dvh] flex items-end overflow-hidden bg-warm-950">
      {/* Full-bleed media */}
      <div className="absolute inset-0">
        <Image
          src="/generated/hero-cinematic.jpg"
          alt={language === "vi" ? "Không gian sống với màu sơn cao cấp" : "Living space with premium paint"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        {/* Cinematic scrim: readable type without killing the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-warm-950 via-warm-950/55 to-warm-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-warm-950/70 via-warm-950/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 pb-16 md:pb-24 pt-32">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl text-left"
        >
          <p className="text-[11px] md:text-xs font-semibold tracking-[0.22em] uppercase text-white/70 mb-5">
            Maison de FLOF
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white tracking-tight leading-[1.05]">
            {language === "vi" ? (
              <>
                Màu sơn cho
                <br />
                ngôi nhà Việt
              </>
            ) : (
              <>
                Color for
                <br />
                Vietnamese homes
              </>
            )}
          </h1>

          <p className="mt-5 md:mt-6 text-sm md:text-base text-white/75 font-light leading-relaxed max-w-md">
            {language === "vi"
              ? "Hơn 1000 sắc. Phối trên phòng mẫu. Mua online hoặc qua đại lý ủy quyền."
              : "1000+ shades. Preview on real rooms. Shop online or visit a dealer."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/colors"
              className="inline-flex items-center gap-2.5 rounded-full bg-jotun-teal text-white text-xs font-bold px-7 py-3.5 hover:bg-jotun-teal-light transition-colors active:scale-[0.98] shadow-[0_12px_40px_rgba(0,123,138,0.35)]"
            >
              {language === "vi" ? "Khám phá màu" : "Explore colors"}
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <Link
              href="/color-visualizer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 backdrop-blur-md text-white text-xs font-bold px-7 py-3.5 hover:bg-white/12 transition-colors active:scale-[0.98]"
            >
              {language === "vi" ? "Phối màu ngay" : "Try visualizer"}
            </Link>
          </div>

          {/* Micro trust strip - coffee landings use this under hero copy */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-white/55 font-medium">
            <span>{language === "vi" ? "1000+ mã màu" : "1000+ colors"}</span>
            <span className="hidden sm:inline text-white/25">|</span>
            <span>{language === "vi" ? "Visualizer phòng mẫu" : "Room visualizer"}</span>
            <span className="hidden sm:inline text-white/25">|</span>
            <span>{language === "vi" ? "Đại lý toàn quốc" : "Nationwide dealers"}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
