"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { PALETTE_COLORS } from "@/lib/color-utils";
import { ColorDetailDrawer } from "@/components/ui/color-detail-drawer";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function ColorsPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const { status: authStatus } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedTone, setSelectedTone] = useState("all");
  const [selectedColor, setSelectedColor] = useState<typeof PALETTE_COLORS[0] | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [colors, setColors] = useState<typeof PALETTE_COLORS>(PALETTE_COLORS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    fetch("/api/colors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setColors(data);
        }
      })
      .catch((err) => console.error("Failed to load dynamic colors:", err));
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetch("/api/profile/favorites")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch((err) => console.error("Failed to load DB wishlist:", err));
      return;
    }

    if (authStatus === "unauthenticated") {
      const saved = localStorage.getItem("sonvn-color-wishlist");
      if (!saved) return;
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        localStorage.removeItem("sonvn-color-wishlist");
      }
    }
  }, [authStatus]);

  const handleToggleFavorite = async (code: string) => {
    const previous = favorites;
    const newFavs = previous.includes(code) ? previous.filter((c) => c !== code) : [...previous, code];
    setFavorites(newFavs);

    if (authStatus !== "authenticated") {
      localStorage.setItem("sonvn-color-wishlist", JSON.stringify(newFavs));
      return;
    }

    try {
      const response = await fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error("Failed to sync favorite");
    } catch (error) {
      setFavorites(previous);
      console.error(error);
    }
  };

  const filteredColors = colors.filter((c) => {
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
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => setSelectedColor(color)}
                className="bg-white rounded-2xl border border-warm-200/80 hover:border-[#88734C]/40 p-3 flex flex-col gap-3 group cursor-pointer hover:shadow-md transition-all duration-300"
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
                <div className="text-left">
                  <span className="text-[9px] font-bold text-warm-400 font-mono tracking-wider block">MÃ: {color.code}</span>
                  <h4 className="font-bold text-xs text-warm-900 group-hover:text-[#88734C] transition-colors truncate mt-0.5">
                    {language === "vi" ? color.name : (color.nameEn || color.name)}
                  </h4>
                  <div className="w-6 h-0.5 bg-transparent mt-2 group-hover:bg-[#88734C] group-hover:w-12 transition-all duration-300" />
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
      <ColorDetailDrawer
        selectedColor={selectedColor}
        onClose={() => setSelectedColor(null)}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        language={language}
      />
    </div>
  );
}
