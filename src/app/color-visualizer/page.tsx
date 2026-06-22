"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles, ArrowRight, Download, Share2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const MOCK_ROOMS = [
  {
    id: "facade",
    name: "Mặt tiền nhà",
    nameEn: "House Facade",
    baseImage: "/facade_sage.webp"
  },
  {
    id: "living",
    name: "Phòng khách",
    nameEn: "Living Room",
    baseImage: "/living_sage.webp"
  },
  {
    id: "bedroom",
    name: "Phòng ngủ",
    nameEn: "Bedroom",
    baseImage: "/bedroom_beige.webp"
  },
  {
    id: "kitchen",
    name: "Phòng bếp",
    nameEn: "Kitchen",
    baseImage: "/kitchen_grey.webp"
  }
];

const CURATED_COMBINATIONS = [
  {
    id: "sage_ivory",
    name: "Soft Sage & Ivory",
    nameVi: "Xanh Rêu & Trắng Ngà",
    theme: "Palette 1 - Bình Yên",
    themeEn: "Palette 1 - Tranquil",
    mainHex: "#4A6741",
    accentHex: "#F5F0E8",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Sự kết hợp giữa xanh rêu đất mộc mạc và trắng ngà ấm áp, mang lại sự bình yên, thư thái.",
    descriptionEn: "A rustic sage green paired with warm ivory white, delivering serene tranquility.",
    images: {
      facade: "/facade_sage.webp",
      living: "/living_sage.webp",
      bedroom: "/bedroom_sage.webp",
      kitchen: "/kitchen_sage.webp"
    }
  },
  {
    id: "beige_cream",
    name: "Warm Beige & Cream",
    nameVi: "Be Cát & Kem Vani",
    theme: "Palette 2 - Ấm Áp",
    themeEn: "Palette 2 - Cozy Warmth",
    mainHex: "#D4C4A8",
    accentHex: "#F3E5D0",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Tông màu trung tính be cát ấm kết hợp kem vani ngọt ngào tạo cảm giác rộng rãi, dễ chịu.",
    descriptionEn: "Earth-toned sandy beige combined with sweet vanilla cream for a spacious, cozy look.",
    images: {
      facade: "/facade_beige.webp",
      living: "/living_beige.webp",
      bedroom: "/bedroom_beige.webp",
      kitchen: "/kitchen_beige.webp"
    }
  },
  {
    id: "terracotta_oak",
    name: "Terracotta & Warm Oak",
    nameVi: "Cam Đất & Gỗ Sồi Ấm",
    theme: "Palette 3 - Sang Trọng",
    themeEn: "Palette 3 - Premium Earthy",
    mainHex: "#CC7722",
    accentHex: "#6F4E37",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Màu cam đất ấm kết hợp sắc nâu gỗ sồi sang trọng mang đậm tinh thần kiến trúc hiện đại.",
    descriptionEn: "Warm terracotta earth tones styled with premium oak wood brown for a timeless design.",
    images: {
      facade: "/facade_terracotta.webp",
      living: "/living_terracotta.webp",
      bedroom: "/bedroom_terracotta.webp",
      kitchen: "/kitchen_terracotta.webp"
    }
  },
  {
    id: "grey_charcoal",
    name: "Mist Grey & Charcoal",
    nameVi: "Xám Sương & Than Củi",
    theme: "Palette 4 - Hiện Đại",
    themeEn: "Palette 4 - Architectural",
    mainHex: "#E2E5E6",
    accentHex: "#333333",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Sự tương phản sắc nét giữa xám sương mù và xám than củi đậm chất đô thị tối giản.",
    descriptionEn: "A sharp contrast of mist grey and deep charcoal slate, perfect for modern minimalism.",
    images: {
      facade: "/facade_grey.webp",
      living: "/living_grey.webp",
      bedroom: "/bedroom_grey.webp",
      kitchen: "/kitchen_grey.webp"
    }
  },
  {
    id: "ocean_sand",
    name: "Ocean Breeze & Sand",
    nameVi: "Xanh Biển & Cát Ấm",
    theme: "Palette 5 - Thư Thái",
    themeEn: "Palette 5 - Coastal Breeze",
    mainHex: "#859FAD",
    accentHex: "#E5DDD0",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Không gian mang hơi gió biển khơi mát mẻ từ xanh pastel dịu và sắc cát ấm bình yên.",
    descriptionEn: "A cool ocean breeze style with soft pastel blue paired with peaceful sand beige.",
    images: {
      facade: "/facade_p5.webp",
      living: "/living_p5.webp",
      bedroom: "/bedroom_p5.webp",
      kitchen: "/kitchen_p5.webp"
    }
  },
  {
    id: "classic_gold",
    name: "Classic Gold & Olive",
    nameVi: "Vàng Cổ Điển & Xanh Rêu",
    theme: "Palette 6 - Cổ Điển",
    themeEn: "Palette 6 - Classic Antique",
    mainHex: "#E5B25D",
    accentHex: "#6B705C",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Sự kết hợp hoài cổ, ấm cúng và đầy tính nghệ thuật giữa vàng mù tạt cổ điển và xanh ô-liu trầm ấm.",
    descriptionEn: "A nostalgic, warm and artistic combination of classic mustard gold and warm olive green.",
    images: {
      facade: "/facade_p6.webp",
      living: "/living_p6.webp",
      bedroom: "/bedroom_p6.webp",
      kitchen: "/kitchen_p6.webp"
    }
  }
];

export default function ColorVisualizerPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [activeRoomId, setActiveRoomId] = useState("facade");
  const [selectedComboId, setSelectedComboId] = useState("sage_ivory");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const activeRoom = MOCK_ROOMS.find((r) => r.id === activeRoomId) || MOCK_ROOMS[0];
  const currentCombo = CURATED_COMBINATIONS.find(c => c.id === selectedComboId) || CURATED_COMBINATIONS[0];

  // Wall color values matching active combo
  const wallMainColor = currentCombo.mainHex;
  const wallAccentColor = currentCombo.accentHex;
  const ceilingColor = currentCombo.ceilingHex;

  // Active pre-rendered image path
  const imageSrc = currentCombo.images[activeRoomId as keyof typeof currentCombo.images];

  const handleReset = () => {
    setSelectedComboId("sage_ivory");
  };

  if (!mounted) return null;

  const surfaces = [
    { value: "wallMain" as const, label: t.paintWallMain, color: wallMainColor },
    { value: "wallAccent" as const, label: t.paintWallAccent, color: wallAccentColor },
    { value: "ceiling" as const, label: t.paintCeiling, color: ceilingColor },
  ];

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300">

      {/* 1. HERO BANNER - Split Layout matching image 1 */}
      <section className="relative w-full border-b border-black/5 bg-[#F2F2EB]">
        <div className="w-full max-w-[1880px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[460px]">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-5 px-6 py-16 md:p-16 xl:p-24 flex flex-col justify-center items-start text-left gap-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-warm-900 leading-tight">
              {language === "vi" ? "Công cụ phối màu" : "Color Visualizer"}
            </h1>
            <p className="text-sm md:text-base text-warm-650 leading-relaxed max-w-xl">
              {language === "vi"
                ? "Bạn không thể đưa ra sự lựa chọn màu sắc cho ngôi nhà? Với công cụ Phối Màu, việc tìm kiếm màu sắc hoàn hảo cho ngôi nhà của bạn chỉ đơn giản bằng một cú chạm. Hãy biến ngôi nhà mơ ước của bạn thành thực tế."
                : "Can't decide on the perfect paint colors for your home? With our interactive Color Visualizer, finding the ideal palette is just a tap away. Bring your dream home to life instantly."}
            </p>
          </motion.div>
          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-7 relative min-h-[320px] lg:min-h-full overflow-hidden"
          >
            <Image
              src="/facade_sage.webp"
              alt="Premium House Exterior"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/5" />
          </motion.div>
        </div>
      </section>

      {/* 2. INTRO PARAGRAPH - Centered style */}
      <section className="py-16 border-b border-black/5 bg-white overflow-hidden">
        <div className="w-full max-w-[1000px] mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-sm md:text-base text-warm-650 leading-relaxed font-medium"
          >
            {language === "vi"
              ? "Trải nghiệm không gian sống chân thực với các tùy chọn phối màu sơn thực tế được phối sắc tỉ mỉ. Thay đổi màu sắc trên các bức tường, mặt tiền kiến trúc một cách thông minh và chiêm ngưỡng các thiết kế thực tế."
              : "Experience realistic living spaces with dual-color combination presets from our premium collection. Intelligently update architectural details and view real-world paint coordinates."}
          </motion.p>
        </div>
      </section>

      {/* 3. INTERACTIVE VISUALIZER TOOL SECTION */}
      <section id="interactive-tool" className="py-24 bg-jotun-ivory">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-left">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif font-bold text-warm-900 mb-3">
              {language === "vi" ? "Màu sắc ngôi nhà bạn" : "Colors of Your House"}
            </h2>
            <p className="text-xs md:text-sm text-warm-550 leading-relaxed max-w-xl mx-auto">
              {language === "vi"
                ? "Thử nghiệm các bộ phối màu sơn thực tế (Curated Palettes) được dựng 3D sắc nét. Chọn bộ màu bên dưới để thay đổi không gian."
                : "Experiment with photo-realistic pre-rendered color palettes. Click any preset below to update the entire space to the matching paint render."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
          >
            {/* Left: Live Preview */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Room Switcher bar */}
              <div className="bg-white border border-warm-200/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-none -mx-1 px-1 flex-grow">
                  <span className="hidden sm:inline text-xs font-bold uppercase text-warm-450 whitespace-nowrap">{t.selectSpace}:</span>
                  <div className="flex gap-2">
                    {MOCK_ROOMS.map((room) => (
                      <motion.button
                        key={room.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setActiveRoomId(room.id);
                        }}
                        className={cn(
                          "px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl border transition-all duration-300 shrink-0",
                          activeRoomId === room.id
                            ? "bg-warm-900 border-warm-900 text-white shadow-sm"
                            : "border-warm-200 hover:bg-warm-50/50 text-warm-700 hover:text-warm-900"
                        )}
                      >
                        {language === "vi" ? room.name : room.nameEn}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 border border-warm-200 hover:border-warm-300 rounded-xl text-[11px] sm:text-xs hover:bg-warm-50/50 font-bold text-warm-700 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden xs:inline">{language === "vi" ? "Đặt lại" : "Reset"}</span>
                </button>
              </div>

              {/* Live Canvas Room Image Preview */}
              <div className="relative aspect-[4/3] sm:aspect-video lg:h-[520px] lg:aspect-none w-full rounded-2xl border border-warm-200/80 overflow-hidden shadow-md bg-warm-955">
                <Image
                  src={imageSrc}
                  alt={activeRoom.name}
                  fill
                  sizes="(min-width: 1024px) 67vw, 100vw"
                  className="object-cover transition-all duration-500"
                />

                {/* Floating badge indicating render realism level */}
                <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {language === "vi" ? "Ảnh Dựng 3D" : "3D Render"}
                  </span>
                </div>

                {/* Floating active colors summary - Desktop only */}
                <div className="hidden sm:flex absolute bottom-5 left-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-warm-100 flex flex-col gap-1.5 text-xs text-left">
                  <span className="font-bold text-warm-850 text-[9px] uppercase tracking-wider mb-0.5">
                    {language === "vi" ? "MÀU ĐANG DÙNG" : "CURRENT SHADES"}
                  </span>
                  {surfaces.map(s => (
                    <div key={s.value} className="flex items-center gap-2">
                      <span className="inline-block w-4.5 h-4.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-warm-850 font-mono font-bold">{s.color}</span>
                      <span className="text-warm-450 font-semibold">· {s.label}</span>
                    </div>
                  ))}
                  <div className="mt-1.5 pt-1.5 border-t border-warm-100 flex flex-col gap-0.5 text-[10px] text-warm-550 font-bold">
                    <span>{language === "vi" ? "BỘ PHỐI MÀU:" : "PALETTE CONCEPT:"}</span>
                    <span className="text-[#88734C]">{language === "vi" ? currentCombo.nameVi : currentCombo.name}</span>
                  </div>
                </div>

                {/* Mobile Sleek bottom colors strip - Mobile only */}
                <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex justify-between items-center bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-warm-100 shadow-lg">
                  <div className="flex gap-2">
                    {surfaces.map(s => (
                      <div key={s.value} className="flex items-center gap-1.5">
                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-[9px] text-warm-900 font-mono font-bold">{s.color}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[9.5px] text-[#88734C] font-bold truncate max-w-[120px]">
                    {language === "vi" ? currentCombo.nameVi : currentCombo.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Controller Sidebar */}
            <div className="lg:col-span-4 bg-white border border-warm-200/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-sm overflow-hidden">
              <div className="flex flex-col gap-6">

                {/* Curated combinations list matching Image 2 */}
                <div>
                  <h3 className="font-serif font-bold text-base text-warm-900 mb-4 uppercase tracking-wider">
                    {language === "vi" ? "Bộ Phối 2 Màu" : "Curated Preset"}
                  </h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-row lg:flex-col gap-3 max-h-[480px] overflow-x-auto lg:overflow-y-auto scrollbar-none pb-3 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0"
                  >
                    {CURATED_COMBINATIONS.map((combo) => {
                      const isActive = selectedComboId === combo.id;
                      return (
                        <motion.button
                          key={combo.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.025, y: -2 }}
                          whileTap={{ scale: 0.975 }}
                          onClick={() => setSelectedComboId(combo.id)}
                          className={cn(
                            "w-[260px] lg:w-full shrink-0 p-4 rounded-xl border text-left flex flex-col gap-2 transition-all duration-300",
                            isActive
                              ? "border-warm-900 bg-warm-50/40 shadow-sm ring-1 ring-warm-900"
                              : "border-warm-150 hover:border-warm-250 hover:bg-warm-50/20"
                          )}
                        >
                          <span className="text-xs font-bold text-warm-900">
                            {language === "vi" ? combo.theme : combo.themeEn}
                          </span>
                          <p className="text-[10px] text-warm-500 leading-relaxed line-clamp-2">
                            {language === "vi" ? combo.descriptionVi : combo.descriptionEn}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: combo.mainHex }}
                              />
                              <span className="text-[10px] text-warm-700 font-mono font-semibold">{combo.mainHex}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: combo.accentHex }}
                              />
                              <span className="text-[10px] text-warm-700 font-mono font-semibold">{combo.accentHex}</span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. SHOWROOM COLOR EXPERIENCE SECTION */}
      <section className="py-24 bg-white border-t border-b border-black/5 overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-5 flex flex-col gap-6"
            >
              <span className="text-[#88734C] font-semibold text-xs tracking-widest flex items-center gap-2 uppercase">
                <Sparkles className="w-4 h-4 text-[#88734C]" />
                {language === "vi" ? "TỰ NHIÊN & TRỰC QUAN" : "REAL & VISUAL"}
              </span>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-warm-900 leading-tight">
                {language === "vi"
                  ? "Xem Trực Tiếp Màu Sơn Tại Showroom"
                  : "Experience Color Swatches at Our Showrooms"}
              </h2>
              <p className="text-sm text-warm-650 leading-relaxed font-light">
                {language === "vi"
                  ? "Đến trực tiếp các đại lý ủy quyền của Maison de FLOF để trải nghiệm hệ thống cây màu, quạt màu chuẩn xác nhất dưới nhiều điều kiện ánh sáng thực tế. Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn lựa chọn dòng sơn tối ưu và tiến hành pha màu sơn tự động ngay tại quầy."
                  : "Visit Maison de FLOF authorized dealers to view real color cards, swatches, and fan decks under various lighting conditions. Our showroom advisors will help you select matching paint categories and tint them instantly."}
              </p>
              <div>
                <Link
                  href="/find-dealer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold rounded-xl transition-all shadow-sm group"
                >
                  <span>{language === "vi" ? "Tìm đại lý gần nhất" : "Find Nearest Showroom"}</span>
                  <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
            {/* Right Showroom Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7 flex justify-center w-full"
            >
              <div className="relative w-full max-w-[650px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-black/5 bg-warm-50 p-2">
                <Image
                  src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800"
                  alt="Maison de FLOF Showroom Color Design Experience"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-102"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>



    </div>
  );
}
