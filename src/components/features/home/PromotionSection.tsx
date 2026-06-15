"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguageStore } from "@/store/language-store";

export function PromotionSection() {
  const { language } = useLanguageStore();

  return (
    <section className="py-20 md:py-24 bg-jotun-ivory-100 border-b border-black/5">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-[1600px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Product Shoot Card */}
          <div className="lg:col-span-5 relative aspect-square max-w-[340px] sm:max-w-[420px] sm:h-[440px] md:h-[540px] w-full flex items-center justify-center mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-jotun-teal/5 to-transparent rounded-2xl -z-10" />
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
              <Image
                src="/product_interior.png"
                alt="Majestic Premium Paint"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* Promo Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left gap-4">
            <h2 className="font-serif font-bold text-2xl md:text-3.5xl lg:text-[2.5rem] text-warm-900 leading-tight">
              {language === "vi" ? (
                <>Majestic Đẹp Nguyên Bản <br /><span className="text-jotun-teal italic">Sắc Sảo & Láng Mịn</span></>
              ) : (
                <>Majestic Pure Beauty <br /><span className="text-jotun-teal italic">Sharp & Smooth Finish</span></>
              )}
            </h2>
            <p className="text-sm lg:text-[1.05rem] text-warm-600 leading-relaxed max-w-2xl">
              {language === "vi"
                ? "Phiên bản sơn nội thất Majestic mới nhất định hình tiêu chuẩn sang trọng cho ngôi nhà của bạn. Với công nghệ tạo màu sắc rực rỡ sắc nét và khả năng lau chùi vượt trội, Majestic bảo vệ không gian sống trong lành, kháng khuẩn và bền bỉ tối đa."
                : "The latest Majestic interior paint sets a new standard of luxury for your home. With vivid color technology and superior washability, Majestic protects clean, antibacterial, and maximally durable living spaces."
              }
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
