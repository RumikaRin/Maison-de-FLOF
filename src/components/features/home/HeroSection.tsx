"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

export function HeroSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full min-h-[min(100dvh,920px)] flex items-center overflow-hidden bg-jotun-ivory pt-20 pb-12 md:pt-16 md:pb-16">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex flex-col gap-6 text-left items-start"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-serif font-bold tracking-tight text-warm-950 leading-[1.12]">
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

          <p className="text-warm-600 text-sm sm:text-base font-light leading-relaxed max-w-md">
            {language === "vi"
              ? "Hơn 1000 sắc, phối trên phòng mẫu, mua online hoặc qua đại lý."
              : "1000+ shades. Preview on real rooms. Shop online or find a dealer."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/colors"
              className="inline-flex items-center gap-2 rounded-full bg-jotun-teal text-white text-xs font-bold px-6 py-3 hover:bg-jotun-teal-dark transition-colors active:scale-[0.98]"
            >
              {language === "vi" ? "Khám phá màu" : "Explore colors"}
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <Link
              href="/color-visualizer"
              className="inline-flex items-center gap-2 rounded-full border border-warm-300 bg-white text-warm-900 text-xs font-bold px-6 py-3 hover:border-jotun-teal/40 hover:text-jotun-teal transition-colors active:scale-[0.98]"
            >
              {language === "vi" ? "Phối màu ngay" : "Try visualizer"}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.1 }}
          className="lg:col-span-7 w-full"
        >
          <div className="relative p-1.5 rounded-[1.75rem] bg-warm-200/50 border border-warm-300/70">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-[1.35rem] bg-warm-100 shadow-lg">
              <Image
                src="/hero_bg.webp"
                alt={language === "vi" ? "Không gian sống cao cấp" : "Premium living space"}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
