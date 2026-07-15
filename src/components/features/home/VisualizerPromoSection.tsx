"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { COLOR_FAMILIES } from "@/lib/constants/home-data";

export function VisualizerPromoSection() {
  const { language } = useLanguageStore();

  return (
    <section id="visualizer-section" className="py-16 md:py-20 bg-jotun-ivory-100 border-b border-black/5 relative overflow-hidden text-left">
      {/* Subtle Dotted Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-[1600px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {language === "vi" ? "CÔNG CỤ KỸ THUẬT SỐ" : "DIGITAL PAINT UTILITY"}
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3.5xl lg:text-[2.5rem] text-warm-900 leading-tight">
              {language === "vi" ? "Công Cụ Phối Màu" : "Color Visualizer"}
            </h2>
            <p className="text-sm text-warm-600 leading-relaxed">
              {language === "vi"
                ? "Bạn gặp khó khăn khi chọn màu sắc hoàn hảo cho ngôi nhà của mình? Với công cụ Phối Màu trực quan từ Maison de FLOF, việc tìm kiếm màu sắc hoàn hảo chỉ đơn giản bằng một cú chạm. Hãy hiện thực hóa ngôi nhà mơ ước của bạn ngay lập tức."
                : "Struggling to choose the perfect color scheme for your home? With Maison de FLOF's intuitive Color Visualizer, finding the ideal palette is just a tap away. Bring your dream spaces to life instantly."}
            </p>

            <motion.div
              whileHover={{ y: -4 }}
              className="mt-4 p-6 bg-white/70 border border-warm-200/60 rounded-2xl flex flex-col gap-4 transition-all duration-300"
            >
              <h3 className="font-serif font-bold text-lg text-warm-900">
                {language === "vi" ? "Màu sắc ngôi nhà bạn" : "Colors of Your House"}
              </h3>
              <p className="text-xs text-warm-550 leading-relaxed">
                {language === "vi"
                  ? "Cá nhân hóa không gian nhà bạn bằng cách thử nghiệm trực quan màu sắc trên hình ảnh ngôi nhà mà bạn mong muốn."
                  : "Personalize your spaces by testing coordinates and color shades in real-time on virtual rooms."}
              </p>
              <Link
                href="/color-visualizer"
                className="inline-flex items-center justify-between border border-[#88734C] text-[#88734C] hover:bg-[#88734C] hover:text-white px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 w-fit gap-3 group"
              >
                <motion.span whileTap={{ scale: 0.98 }}>{language === "vi" ? "HÃY THỬ NGAY" : "TRY IT NOW"}</motion.span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          <div className="lg:col-span-7 relative flex justify-center items-center">
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative w-full max-w-[620px] aspect-square rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
            >
              <Image
                src="/visualizer_mockup.webp"
                alt="Modern Visualizer Design with Dual Colors"
                fill
                className="object-cover transition-transform duration-700 hover:scale-103"
                priority
              />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-warm-250 pt-16">
          <div className="bg-white/60 border border-warm-200/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-48 h-48 shrink-0 rounded-xl overflow-hidden shadow-md bg-warm-100">
              <Image
                src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400"
                alt="Explore Colors"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-serif font-bold text-lg text-warm-900 leading-snug">
                {language === "vi" ? "Khám phá màu sắc của Maison de FLOF" : "Discover Maison de FLOF Paint Colors"}
              </h3>
              <p className="text-xs text-warm-550 leading-relaxed">
                {language === "vi"
                  ? "Duyệt qua bộ sưu tập mã màu thời thượng đa dạng, được cập nhật theo xu hướng mới nhất để tìm ra sắc màu hoàn hảo thể hiện cá tính của bạn."
                  : "Explore our diverse palette and curated collections, updated with the latest trends to find the absolute perfect shade."}
              </p>
              <Link href="/colors" className="text-xs font-bold text-[#88734C] hover:underline flex items-center gap-1">
                <span>{language === "vi" ? "Xem bảng màu" : "Browse catalog"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="bg-white/60 border border-warm-200/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-48 h-48 shrink-0 rounded-xl overflow-hidden shadow-md bg-warm-100">
              <Image
                src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400"
                alt="Test colors"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-serif font-bold text-lg text-warm-900 leading-snug">
                {language === "vi" ? "Thử nghiệm với nhiều màu sắc" : "Experiment with Color Tones"}
              </h3>
              <p className="text-xs text-warm-550 leading-relaxed">
                {language === "vi"
                  ? "Trực quan hóa sự chuyển đổi màu sắc trên các bức tường để thấy được sức sống mới mà các gam màu khác nhau mang lại cho ngôi nhà."
                  : "Visualize paint color shifts on virtual walls instantly to discover how different tones inject new energy into your spaces."}
              </p>
              <Link href="/color-visualizer" className="text-xs font-bold text-[#88734C] hover:underline flex items-center gap-1">
                <span>{language === "vi" ? "Thử màu trực tuyến" : "Try visualizer"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
