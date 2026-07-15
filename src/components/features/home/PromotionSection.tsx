"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

/**
 * Second hero / featured product band.
 * Dual stacked imagery inspired by coffee landing "booking" collages,
 * product shot quality closer to Aura cosmetics/furniture templates.
 */
export function PromotionSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-20 md:py-28 bg-jotun-ivory overflow-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Dual image stack */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative mx-auto max-w-[480px] lg:max-w-none">
              {/* Main product plate */}
              <div className="relative aspect-square w-[78%] ml-0 rounded-[1.75rem] overflow-hidden bg-warm-900 shadow-[0_30px_80px_rgba(47,40,34,0.22)]">
                <Image
                  src="/generated/promo-paint-can.jpg"
                  alt={language === "vi" ? "Sơn nội thất Majestic" : "Majestic interior paint"}
                  fill
                  sizes="(min-width: 1024px) 35vw, 80vw"
                  className="object-cover"
                />
              </div>
              {/* Overlapping lifestyle tile */}
              <div className="absolute -bottom-6 -right-2 sm:right-0 w-[48%] aspect-[3/4] rounded-[1.35rem] overflow-hidden border-[6px] border-jotun-ivory shadow-[0_20px_50px_rgba(47,40,34,0.18)] bg-warm-100">
                <Image
                  src="/generated/promo-wall-detail.jpg"
                  alt={language === "vi" ? "Chi tiết tường sơn" : "Painted wall detail"}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.08 }}
            className="lg:col-span-6 flex flex-col items-start text-left pt-8 lg:pt-0"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-jotun-teal" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jotun-teal">
                {language === "vi" ? "Dòng nổi bật" : "Featured line"}
              </p>
            </div>

            <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-[2.75rem] text-warm-950 leading-[1.12]">
              {language === "vi" ? (
                <>
                  Majestic đẹp nguyên bản.
                  <br />
                  <span className="text-warm-600 font-normal italic">Sắc sảo & láng mịn.</span>
                </>
              ) : (
                <>
                  Majestic pure beauty.
                  <br />
                  <span className="text-warm-600 font-normal italic">Sharp & smooth finish.</span>
                </>
              )}
            </h2>

            <p className="mt-5 text-sm md:text-[15px] text-warm-550 leading-relaxed max-w-lg">
              {language === "vi"
                ? "Sơn nội thất cao cấp cho tường trong nhà: màu rực rỡ, dễ lau chùi, bề mặt bền đẹp. Chuẩn sang trọng cho không gian sống hiện đại."
                : "Premium interior paint for indoor walls: vivid color, easy clean, durable finish. A refined standard for modern living spaces."}
            </p>

            {/* Feature pills like coffee "đặc trưng" but denser */}
            <ul className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {[
                language === "vi" ? "Lau chùi tốt" : "Washable",
                language === "vi" ? "Màu sắc nét" : "True color",
                language === "vi" ? "Bền bề mặt" : "Durable film",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-warm-200 bg-white px-4 py-3 text-center text-[11px] font-bold text-warm-800"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-warm-900 text-white text-xs font-bold px-6 py-3.5 hover:bg-warm-800 transition-colors active:scale-[0.98]"
              >
                {language === "vi" ? "Xem sản phẩm" : "View products"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-2 rounded-full border border-warm-300 bg-white text-warm-800 text-xs font-bold px-6 py-3.5 hover:border-jotun-teal/40 hover:text-jotun-teal transition-colors"
              >
                {language === "vi" ? "Tư vấn báo giá" : "Request a quote"}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
