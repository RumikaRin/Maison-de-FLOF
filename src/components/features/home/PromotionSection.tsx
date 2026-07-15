"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

export function PromotionSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-24 bg-white border-y border-warm-200/80">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
        >
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative p-1.5 rounded-[1.75rem] bg-warm-100 border border-warm-200 max-w-[440px] mx-auto lg:mx-0">
              <div className="relative aspect-square w-full overflow-hidden rounded-[1.35rem] bg-jotun-ivory">
                <Image
                  src="/product_interior.webp"
                  alt={language === "vi" ? "Sơn nội thất Majestic" : "Majestic interior paint"}
                  fill
                  sizes="(min-width: 1024px) 35vw, 90vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col items-start text-left gap-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-jotun-teal">
              {language === "vi" ? "Dòng nổi bật" : "Featured line"}
            </p>
            <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-[2.6rem] text-warm-950 leading-[1.15]">
              {language === "vi" ? (
                <>
                  Majestic đẹp nguyên bản
                  <br />
                  <span className="text-jotun-teal">Sắc sảo, láng mịn</span>
                </>
              ) : (
                <>
                  Majestic pure beauty
                  <br />
                  <span className="text-jotun-teal">Sharp, smooth finish</span>
                </>
              )}
            </h2>
            <p className="text-sm md:text-base text-warm-550 leading-relaxed max-w-xl">
              {language === "vi"
                ? "Sơn nội thất cao cấp với màu rực rỡ, dễ lau chùi và bề mặt bền đẹp cho không gian sống trong nhà."
                : "Premium interior paint with vivid color, easy clean and a durable finish for living spaces."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-warm-900 text-white text-xs font-bold px-5 py-3 hover:bg-warm-800 transition-colors active:scale-[0.98]"
              >
                {language === "vi" ? "Xem sản phẩm" : "View products"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-2 rounded-full border border-warm-300 text-warm-800 text-xs font-bold px-5 py-3 hover:border-jotun-teal/40 hover:text-jotun-teal transition-colors"
              >
                {language === "vi" ? "Tư vấn báo giá" : "Request a quote"}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
