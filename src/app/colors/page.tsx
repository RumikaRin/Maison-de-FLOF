"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { Heart, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import {
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  hexToRgb,
  hexToHsl
} from "@/lib/color-utils";
import { cn } from "@/lib/utils";

export const PALETTE_COLORS = [
  // White
  { code: "0001", name: "Trắng Tinh Khôi", nameEn: "Pure White", hex: "#FFFFFF", toneFamily: "neutral", colorFamily: "white" },
  { code: "1001", name: "Trắng Ngà", nameEn: "Ivory White", hex: "#F5F0E8", toneFamily: "warm", colorFamily: "white" },
  { code: "1002", name: "Trắng Sữa", nameEn: "Milk White", hex: "#FFF8F0", toneFamily: "warm", colorFamily: "white" },
  { code: "1003", name: "Trắng Ánh Bạc", nameEn: "Silver White", hex: "#F2F4F5", toneFamily: "cool", colorFamily: "white" },
  // Beige
  { code: "2001", name: "Kem Vani", nameEn: "Vanilla Cream", hex: "#F3E5D0", toneFamily: "warm", colorFamily: "beige" },
  { code: "2002", name: "Be Cát", nameEn: "Desert Sand", hex: "#D4C4A8", toneFamily: "warm", colorFamily: "beige" },
  { code: "2003", name: "Nâu Sữa Nhạt", nameEn: "Latte Light", hex: "#EADCC9", toneFamily: "warm", colorFamily: "beige" },
  // Grey
  { code: "3001", name: "Xám Nhạt", nameEn: "Light Grey", hex: "#D3D3D3", toneFamily: "neutral", colorFamily: "grey" },
  { code: "3002", name: "Xám Bạc", nameEn: "Silver Grey", hex: "#C0C0C0", toneFamily: "cool", colorFamily: "grey" },
  { code: "3003", name: "Xám Than", nameEn: "Charcoal Grey", hex: "#4A4A4A", toneFamily: "neutral", colorFamily: "grey" },
  { code: "3004", name: "Xám Sương Mù", nameEn: "Mist Grey", hex: "#E2E5E6", toneFamily: "cool", colorFamily: "grey" },
  // Yellow
  { code: "4001", name: "Vàng Chanh", nameEn: "Lemon Yellow", hex: "#F7E856", toneFamily: "warm", colorFamily: "yellow" },
  { code: "4002", name: "Vàng Nắng", nameEn: "Sunny Gold", hex: "#FFD93D", toneFamily: "warm", colorFamily: "yellow" },
  { code: "4003", name: "Vàng Hoa Cúc", nameEn: "Marigold", hex: "#F2C94C", toneFamily: "warm", colorFamily: "yellow" },
  // Orange
  { code: "5001", name: "Cam San Hô", nameEn: "Coral Orange", hex: "#FF7F50", toneFamily: "warm", colorFamily: "orange" },
  { code: "5002", name: "Cam Đất Ấm", nameEn: "Terracotta", hex: "#CC7722", toneFamily: "earth", colorFamily: "orange" },
  // Red
  { code: "6001", name: "Đỏ Rượu Vang", nameEn: "Wine Red", hex: "#722F37", toneFamily: "bold", colorFamily: "red" },
  { code: "6002", name: "Đỏ Gạch", nameEn: "Brick Red", hex: "#CB4154", toneFamily: "bold", colorFamily: "red" },
  // Blue
  { code: "7001", name: "Xanh Biển Khơi", nameEn: "Ocean Blue", hex: "#0077B6", toneFamily: "cool", colorFamily: "blue" },
  { code: "7002", name: "Xanh Pastel", nameEn: "Pastel Blue", hex: "#AEC6CF", toneFamily: "pastel", colorFamily: "blue" },
  { code: "7003", name: "Xanh Teal Cao Cấp", nameEn: "Teal Blue", hex: "#008080", toneFamily: "bold", colorFamily: "blue" },
  // Green
  { code: "8001", name: "Xanh Lá Mạ", nameEn: "Light Green", hex: "#77DD77", toneFamily: "pastel", colorFamily: "green" },
  { code: "8002", name: "Xanh Rêu", nameEn: "Moss Green", hex: "#4A6741", toneFamily: "earth", colorFamily: "green" },
  { code: "8003", name: "Xanh Olive", nameEn: "Olive Green", hex: "#808000", toneFamily: "earth", colorFamily: "green" },
  // Brown
  { code: "9001", name: "Nâu Gỗ Nhạt", nameEn: "Wood Brown", hex: "#8B4513", toneFamily: "earth", colorFamily: "brown" },
  { code: "9002", name: "Nâu Cà Phê", nameEn: "Coffee Brown", hex: "#6F4E37", toneFamily: "earth", colorFamily: "brown" }
];

export default function ColorsPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedTone, setSelectedTone] = useState("all");
  const [selectedColor, setSelectedColor] = useState<typeof PALETTE_COLORS[0] | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sonvn-color-wishlist");
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  const handleToggleFavorite = (code: string) => {
    let newFavs: string[];
    if (favorites.includes(code)) {
      newFavs = favorites.filter((c) => c !== code);
    } else {
      newFavs = [...favorites, code];
    }
    setFavorites(newFavs);
    localStorage.setItem("sonvn-color-wishlist", JSON.stringify(newFavs));
  };

  const filteredColors = PALETTE_COLORS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.code.includes(searchQuery);
    const matchesFamily = selectedFamily === "all" || c.colorFamily === selectedFamily;
    const matchesTone = selectedTone === "all" || c.toneFamily === selectedTone;
    return matchesSearch && matchesFamily && matchesTone;
  });

  const colorFamilies = [
    { value: "all", label: t.allColors },
    { value: "white", label: t.colorFamilyWhite },
    { value: "beige", label: t.colorFamilyBeige },
    { value: "yellow", label: t.colorFamilyYellow },
    { value: "orange", label: t.colorFamilyOrange },
    { value: "red", label: t.colorFamilyRed },
    { value: "blue", label: t.colorFamilyBlue },
    { value: "green", label: t.colorFamilyGreen },
    { value: "grey", label: t.colorFamilyGrey },
    { value: "brown", label: t.colorFamilyBrown },
  ];

  const toneFamilies = [
    { value: "all", label: language === "vi" ? "Tất cả tông" : "All tones" },
    { value: "warm", label: t.toneWarm },
    { value: "cool", label: t.toneCool },
    { value: "neutral", label: t.toneNeutral },
    { value: "pastel", label: t.tonePastel },
    { value: "bold", label: t.toneBold },
    { value: "earth", label: t.toneEarth },
  ];

  let compColor = "";
  let analogous: string[] = [];
  let triadic: string[] = [];
  let rgbVal = "";
  let hslVal = "";

  if (selectedColor) {
    compColor = getComplementaryColors(selectedColor.hex)[0];
    analogous = getAnalogousColors(selectedColor.hex);
    triadic = getTriadicColors(selectedColor.hex);
    const rgb = hexToRgb(selectedColor.hex);
    rgbVal = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    const hsl = hexToHsl(selectedColor.hex);
    hslVal = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="py-16 md:py-20 relative bg-jotun-ivory text-left"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-left relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-warm-900 mb-4 tracking-tight">
            {t.colorCatalogTitle}
          </h1>
          <p className="text-warm-500 text-sm max-w-2xl leading-relaxed font-medium">
            {t.colorCatalogSub}
          </p>
        </div>
      </motion.div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 text-left">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
          className="bg-white border border-warm-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-8"
        >
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={t.searchColorPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Color Family Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left min-w-44"
                >
                  <span className="truncate">
                    {colorFamilies.find((f) => f.value === selectedFamily)?.label || t.allColors}
                  </span>
                  <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                <DropdownMenuRadioGroup value={selectedFamily} onValueChange={setSelectedFamily}>
                  {colorFamilies.map((fam) => (
                    <DropdownMenuRadioItem
                      key={fam.value}
                      value={fam.value}
                      className="text-xs font-semibold text-warm-900 cursor-pointer"
                    >
                      {fam.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tone Family Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left min-w-44"
                >
                  <span className="truncate">
                    {toneFamilies.find((tf) => tf.value === selectedTone)?.label || (language === "vi" ? "Tất cả tông" : "All tones")}
                  </span>
                  <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                <DropdownMenuRadioGroup value={selectedTone} onValueChange={setSelectedTone}>
                  {toneFamilies.map((tf) => (
                    <DropdownMenuRadioItem
                      key={tf.value}
                      value={tf.value}
                      className="text-xs font-semibold text-warm-900 cursor-pointer"
                    >
                      {tf.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-xs text-warm-450 font-bold ml-auto md:ml-0">
              {filteredColors.length} {language === "vi" ? "màu sắc" : "colors"}
            </span>
          </div>
        </motion.div>

        {/* Color Grid */}
        <motion.div
          key={selectedFamily + selectedTone + searchQuery}
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.02 } }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5"
        >
          {filteredColors.map((color) => {
            const isFav = favorites.includes(color.code);
            return (
              <motion.div
                key={color.code}
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 12 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.5 } }
                }}
                onClick={() => setSelectedColor(color)}
                className="bg-white rounded-2xl border border-warm-200/80 p-3 flex flex-col gap-3 group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  className="h-28 rounded-xl border border-black/5 flex items-center justify-center relative shadow-inner"
                  style={{ backgroundColor: color.hex }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(color.code);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full shadow-sm text-warm-600 hover:text-rose-500 transition-all duration-300 flex items-center justify-center"
                  >
                    <Heart className={cn("h-3.5 w-3.5 transition-colors", isFav ? "fill-rose-500 text-rose-500" : "text-warm-500")} />
                  </button>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-warm-400 font-mono tracking-wider block">MÃ: {color.code}</span>
                  <h4 className="font-bold text-xs text-warm-900 group-hover:text-jotun-teal transition-colors truncate mt-0.5">
                    {language === "vi" ? color.name : (color.nameEn || color.name)}
                  </h4>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredColors.length === 0 && (
          <div className="text-center py-20 text-warm-400">
            <p className="text-sm font-bold">{language === "vi" ? "Không tìm thấy màu sắc phù hợp." : "No colors found matching your search."}</p>
          </div>
        )}
      </div>

      {/* Color Detail Side Panel */}
      {selectedColor && (
        <div
          onClick={() => setSelectedColor(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-l border-warm-200/80 w-full max-w-lg h-screen pt-14 pb-8 px-8 flex flex-col gap-6 overflow-y-auto relative shadow-2xl text-left animate-fade-in-up"
          >
            <button
              onClick={() => setSelectedColor(null)}
              className="absolute top-4 right-6 h-9 w-9 rounded-full border border-warm-200 hover:bg-warm-100 flex items-center justify-center transition-all text-warm-700 hover:scale-105"
              title={language === "vi" ? "Đóng" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Swatch Display */}
            <div
              className="h-52 w-full rounded-2xl border border-black/5 flex flex-col justify-end p-6 relative shadow-inner mt-2 overflow-hidden"
              style={{ backgroundColor: selectedColor.hex }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-2xl" />
              <div className="relative z-10 flex justify-between items-end">
                <div>
                  <span className="text-[11px] font-mono tracking-wider text-white/80">#{selectedColor.code}</span>
                  <h2 className="text-2xl font-bold font-serif mt-1 text-white">
                    {language === "vi" ? selectedColor.name : (selectedColor.nameEn || selectedColor.name)}
                  </h2>
                </div>
                <button
                  onClick={() => handleToggleFavorite(selectedColor.code)}
                  className="bg-white/95 hover:bg-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-warm-900 text-xs font-bold transition-all duration-300 shadow-sm"
                >
                  <Heart className={cn("h-3.5 w-3.5 transition-colors", favorites.includes(selectedColor.code) ? "fill-rose-500 text-rose-500" : "text-warm-400")} />
                  <span>{favorites.includes(selectedColor.code) ? (language === "vi" ? "Đã thích" : "Liked") : t.addToFavorites}</span>
                </button>
              </div>
            </div>

            {/* Color Codes SECTION */}
            <div className="grid grid-cols-3 gap-4 border-y border-warm-200 py-4">
              <div>
                <span className="block text-[10px] text-warm-400 uppercase font-bold tracking-wider mb-1">Hex</span>
                <span className="font-mono text-sm font-semibold text-warm-900">{selectedColor.hex}</span>
              </div>
              <div>
                <span className="block text-[10px] text-warm-400 uppercase font-bold tracking-wider mb-1">RGB</span>
                <span className="font-mono text-sm font-semibold text-warm-900">{rgbVal}</span>
              </div>
              <div>
                <span className="block text-[10px] text-warm-400 uppercase font-bold tracking-wider mb-1">HSL</span>
                <span className="font-mono text-sm font-semibold text-warm-900">{hslVal}</span>
              </div>
            </div>

            {/* Complementary Colors */}
            <div>
              <h3 className="font-serif font-bold text-lg mb-4 text-warm-900">
                {t.complementaryColors}
              </h3>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-warm-200 mb-4 shadow-xs">
                <div
                  className="h-14 w-14 rounded-xl border border-black/5 shrink-0"
                  style={{ backgroundColor: compColor }}
                />
                <div>
                  <span className="text-xs text-warm-500 font-semibold block mb-0.5">
                    {language === "vi" ? "Màu tương phản (180°)" : "Complementary (180°)"}
                  </span>
                  <span className="font-mono text-sm font-bold text-warm-900">{compColor}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">{t.analogousColors}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {analogous.map((hex, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border border-warm-200 rounded-xl shadow-xs hover:border-[#88734C]/20 transition-all duration-200">
                        <div className="h-9 w-9 rounded-lg border border-black/5" style={{ backgroundColor: hex }} />
                        <span className="font-mono text-xs font-bold text-warm-850">{hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">{t.triadicColors}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {triadic.map((hex, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border border-warm-200 rounded-xl shadow-xs hover:border-[#88734C]/20 transition-all duration-200">
                        <div className="h-9 w-9 rounded-lg border border-black/5" style={{ backgroundColor: hex }} />
                        <span className="font-mono text-xs font-bold text-warm-850">{hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Compatibility */}
            <div className="p-4 border border-[#88734C]/20 bg-[#88734C]/5 rounded-xl flex gap-3 text-xs text-warm-850">
              <div>
                <h4 className="font-bold mb-0.5">
                  ✓ {language === "vi" ? "Tương thích pha màu tự động" : "Auto tinting compatible"}
                </h4>
                <p className="leading-relaxed opacity-90">
                  {language === "vi"
                    ? "Mã màu này được lập trình cho máy pha sơn tự động của Maison de FLOF, sử dụng cho Majestic và Jotashield."
                    : "This color code is programmed for Maison de FLOF automatic tinting machines for Majestic and Jotashield."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
