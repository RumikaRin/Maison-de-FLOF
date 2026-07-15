"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Layers, Palette, Smartphone } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

const ROOMS = [
  { src: "/living_sage.webp", labelVi: "Phòng khách", labelEn: "Living" },
  { src: "/bedroom_beige.webp", labelVi: "Phòng ngủ", labelEn: "Bedroom" },
  { src: "/kitchen_grey.webp", labelVi: "Phòng bếp", labelEn: "Kitchen" },
  { src: "/facade_p5.webp", labelVi: "Mặt tiền", labelEn: "Facade" },
];

export function VisualizerPromoSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  const features = [
    {
      icon: Layers,
      titleVi: "4 không gian mẫu",
      titleEn: "4 sample rooms",
      bodyVi: "Phòng khách, ngủ, bếp và mặt tiền để thử màu thực tế hơn.",
      bodyEn: "Living, bedroom, kitchen and facade for realistic previews.",
    },
    {
      icon: Palette,
      titleVi: "Đổi màu tức thì",
      titleEn: "Instant recolor",
      bodyVi: "Chạm swatch để thấy tường đổi màu ngay, so sánh tone dễ dàng.",
      bodyEn: "Tap a swatch to recolor walls and compare tones easily.",
    },
    {
      icon: Smartphone,
      titleVi: "Dùng mọi thiết bị",
      titleEn: "Works on any device",
      bodyVi: "Mở visualizer trên điện thoại hoặc máy tính, không cần cài app.",
      bodyEn: "Open the visualizer on phone or desktop - no app install.",
    },
  ];

  return (
    <section
      id="visualizer-section"
      className="py-20 md:py-28 bg-warm-950 text-white relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,123,138,0.22),_transparent_55%)]" />

      <div className="relative w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-jotun-teal" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jotun-teal">
                {language === "vi" ? "Công cụ số" : "Digital tool"}
              </p>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-tight text-white">
              {language === "vi" ? "Công cụ phối màu" : "Color visualizer"}
            </h2>
            <p className="mt-4 text-sm text-white/65 leading-relaxed max-w-md">
              {language === "vi"
                ? "Thử màu sơn trên không gian mẫu trước khi mua. Tìm tone phù hợp chỉ bằng vài thao tác."
                : "Preview paint colors on sample rooms before you buy. Find the right tone in a few taps."}
            </p>

            <div className="mt-7 space-y-4">
              {features.map((f) => (
                <div key={f.titleEn} className="flex gap-3 items-start">
                  <span className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0 text-jotun-teal">
                    <f.icon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {language === "vi" ? f.titleVi : f.titleEn}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                      {language === "vi" ? f.bodyVi : f.bodyEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/color-visualizer"
                className="inline-flex items-center gap-2 rounded-full bg-jotun-teal text-white text-xs font-bold px-6 py-3.5 hover:bg-jotun-teal-light transition-colors active:scale-[0.98]"
              >
                {language === "vi" ? "Thử ngay" : "Try it now"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/colors"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 text-white text-xs font-bold px-6 py-3.5 hover:bg-white/10 transition-colors"
              >
                {language === "vi" ? "Xem bảng màu" : "Browse colors"}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.08 }}
            className="lg:col-span-7"
          >
            <Link
              href="/color-visualizer"
              className="group block relative rounded-[1.5rem] overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full">
                <Image
                  src="/visualizer_mockup.webp"
                  alt={language === "vi" ? "Giao diện phối màu" : "Color visualizer mockup"}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-white/90">
                    {language === "vi"
                      ? "Mở visualizer toàn màn hình"
                      : "Open full-screen visualizer"}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-warm-900 text-[11px] font-bold px-3.5 py-2">
                    {language === "vi" ? "Bắt đầu" : "Start"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ROOMS.map((room) => (
                <Link
                  key={room.src}
                  href="/color-visualizer"
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10"
                >
                  <Image
                    src={room.src}
                    alt={language === "vi" ? room.labelVi : room.labelEn}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white">
                    {language === "vi" ? room.labelVi : room.labelEn}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom dual cards - keep discovery CTAs */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center">
            <div className="relative w-full sm:w-36 h-36 shrink-0 rounded-2xl overflow-hidden">
              <Image
                src="/living_beige.webp"
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-white">
                {language === "vi"
                  ? "Khám phá màu sắc Maison de FLOF"
                  : "Discover FLOF paint colors"}
              </h3>
              <p className="mt-2 text-xs text-white/50 leading-relaxed">
                {language === "vi"
                  ? "Duyệt bộ sưu tập theo gia đình màu và xu hướng mới nhất."
                  : "Browse collections by family and the latest trends."}
              </p>
              <Link
                href="/colors"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-jotun-teal hover:text-white transition-colors"
              >
                {language === "vi" ? "Xem bảng màu" : "Browse catalog"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center">
            <div className="relative w-full sm:w-36 h-36 shrink-0 rounded-2xl overflow-hidden">
              <Image
                src="/kitchen_sage.webp"
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-white">
                {language === "vi"
                  ? "Thử nghiệm nhiều tông màu"
                  : "Experiment with tones"}
              </h3>
              <p className="mt-2 text-xs text-white/50 leading-relaxed">
                {language === "vi"
                  ? "So sánh sắc tường trên không gian mẫu để chọn gam phù hợp nhà bạn."
                  : "Compare wall tones on sample spaces to match your home."}
              </p>
              <Link
                href="/color-visualizer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-jotun-teal hover:text-white transition-colors"
              >
                {language === "vi" ? "Thử màu trực tuyến" : "Try visualizer"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
