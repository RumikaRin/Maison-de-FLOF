"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguageStore } from "@/store/language-store";

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const heroItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function HeroSection() {
  const { language } = useLanguageStore();

  return (
    <section className="relative w-full pt-14 pb-10 md:pt-5 md:pb-10 overflow-hidden bg-jotun-ivory">
      {/* Subtle grid accent background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Text Column */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 flex flex-col gap-8 text-left items-start"
        >
          <motion.h1
            variants={heroItemVariants}
            className="text-3xl sm:text-4xl lg:text-[3rem] font-serif font-bold tracking-tight text-warm-955"
            style={{ lineHeight: 1.35 }}
          >
            {language === "vi" ? (
              <>Kiến tạo không gian sống <br /><span className="font-normal italic text-jotun-teal">Đậm chất nghệ thuật</span></>
            ) : (
              <>Creating living spaces <br /><span className="font-normal italic text-jotun-teal">Full of artistic flavor</span></>
            )}
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-warm-600 text-sm lg:text-[1.05rem] font-light leading-relaxed max-w-xl"
          >
            {language === "vi"
              ? "Hơn 1000+ sắc màu sơn cao cấp từ Maison de FLOF mang đến sự kết hợp hoàn mỹ giữa nghệ thuật và công nghệ bảo vệ bề mặt, tôn vinh kiến trúc ngôi nhà Việt."
              : "Over 1000+ premium paint colors from Maison de FLOF deliver a perfect blend of art and surface protection technology, honoring Vietnamese home architecture."
            }
          </motion.p>
        </motion.div>

        {/* Right Image Column (Double Bezel Layout) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="lg:col-span-7 w-full flex justify-center items-center"
        >
          <div className="relative aspect-[4/3] sm:h-[450px] md:h-[620px] lg:h-[720px] xl:h-[800px] lg:aspect-none w-full overflow-hidden bg-white shadow-2xl rounded-3xl border border-black/5 max-w-[960px]">
            <Image
              src="/hero_bg.webp"
              alt={language === "vi" ? "Không gian sống cao cấp" : "Premium living space"}
              fill
              className="object-cover transition-transform duration-1000 hover:scale-103"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
