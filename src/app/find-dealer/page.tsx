"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { ChevronDown, MapPin, Phone, Search, Map as MapIcon, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

const DealerMap = dynamic(() => import("@/components/maps/dealer-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-warm-50 text-xs font-semibold text-warm-500">
      Đang tải bản đồ...
    </div>
  ),
});

interface Dealer {
  id: string;
  name: string;
  nameEn: string;
  phone: string;
  email: string;
  address: string;
  addressEn: string;
  province: string;
  district: string;
  brand: string;
  lng: number;
  lat: number;
}

const BRAND_COLORS: Record<string, string> = {
  "Jotun": "bg-red-50 text-red-600 border-red-100",
  "Dulux": "bg-purple-50 text-purple-600 border-purple-100",
  "Nippon Paint": "bg-blue-50 text-blue-600 border-blue-100",
};

export default function FindDealerPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("Tất cả / All");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả / All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const [mapViewport, setMapViewport] = useState({
    center: [105.787, 21.027] as [number, number],
    zoom: 11,
    bearing: 0,
    pitch: 0
  });

  useEffect(() => {
    setMounted(true);

    fetch("/api/dealers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDealers(data);
        }
      })
      .catch((err) => console.error("Error loading dealers from DB API:", err));
  }, []);

  const provinces = ["Tất cả / All", ...Array.from(new Set(dealers.map((dealer) => dealer.province)))];
  const brands = ["Tất cả / All", ...Array.from(new Set(dealers.map((dealer) => dealer.brand)))];

  useEffect(() => {
    if (selectedProvince === "Hà Nội") {
      setMapViewport({ center: [105.787, 21.027], zoom: 11, bearing: 0, pitch: 0 });
    } else if (selectedProvince === "Hồ Chí Minh") {
      setMapViewport({ center: [106.735, 10.81], zoom: 11, bearing: 0, pitch: 0 });
    } else if (selectedProvince === "Đà Nẵng") {
      setMapViewport({ center: [108.2215, 16.0601], zoom: 11, bearing: 0, pitch: 0 });
    }
  }, [selectedProvince]);

  const handleDealerClick = (dl: Dealer) => {
    setMapViewport({ center: [dl.lng, dl.lat], zoom: 13.5, bearing: 0, pitch: 0 });
    setMobileView("map");
  };

  const filteredDealers = dealers.filter((d) => {
    const matchesProvince = selectedProvince === "Tất cả / All" || d.province === selectedProvince;
    const matchesBrand = selectedBrand === "Tất cả / All" || d.brand === selectedBrand;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvince && matchesBrand && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300">

      {/* ── HEADER ── */}
      <section className="relative w-full pt-20 md:pt-24 overflow-hidden bg-jotun-ivory border-b border-black/5">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 xl:px-16 relative z-10">
          {/* Mobile: stacked layout */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">

            {/* Mobile: compact text-only hero, image hidden on xs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-5 flex flex-col gap-4 items-start justify-center text-left py-8 md:py-12 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-jotun-teal/10 border border-jotun-teal/20 rounded-full text-[10px] font-bold text-jotun-teal uppercase tracking-wider">
                <MapPin className="h-3 w-3" />
                {language === "vi" ? "Mạng lưới toàn quốc" : "Nationwide network"}
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-[2.75rem] font-serif font-bold text-warm-900 tracking-tight"
                style={{ lineHeight: 1.3 }}
              >
                {language === "vi" ? (
                  <>Tìm Đại Lý Sơn <br className="hidden sm:block" /><span className="font-normal italic text-jotun-teal">Gần Nhất</span></>
                ) : (
                  <>Find Our Nearest <br className="hidden sm:block" /><span className="font-normal italic text-jotun-teal">Dealer</span></>
                )}
              </h1>

              <p className="text-sm text-warm-600 leading-relaxed font-light max-w-md">
                {language === "vi"
                  ? "Tìm kiếm các đại lý ủy quyền chính hãng trên toàn quốc. Nhận tư vấn trực tiếp từ đội ngũ chuyên gia."
                  : "Search authorized paint dealers nationwide. Get direct advice from our expert team."}
              </p>

              <div className="flex flex-col gap-2 text-xs font-semibold text-warm-600 border-l-2 border-jotun-teal/40 pl-3 py-0.5">
                <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-jotun-teal shrink-0" />{language === "vi" ? "100% sơn chính hãng ủy quyền" : "100% genuine authorized products"}</p>
                <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-jotun-teal shrink-0" />{language === "vi" ? "Bảng giá niêm yết công khai" : "Transparent public pricing"}</p>
                <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-jotun-teal shrink-0" />{language === "vi" ? "Hỗ trợ pha màu máy tính" : "Computer color tinting support"}</p>
              </div>
            </motion.div>

            {/* Image: hidden on mobile, visible on lg+ */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="hidden lg:flex lg:col-span-7 order-2 lg:order-1 relative justify-center items-center pb-10"
            >
              <div className="relative w-full max-w-[620px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-black/5 bg-white">
                <Image
                  src="/showroom_hero.webp"
                  alt={language === "vi" ? "Showroom sơn cao cấp" : "Premium Paint Showroom"}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">

        {/* Filter bar — responsive */}
        <div className="bg-white border border-warm-200/80 rounded-2xl p-4 shadow-sm mb-6">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm tên đại lý hoặc địa chỉ..." : "Search dealer name or address..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-warm-900 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdowns row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Province */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3 py-2.5 h-9 shadow-sm min-w-0 sm:min-w-36">
                  <span className="truncate">{selectedProvince === "Tất cả / All" ? (language === "vi" ? "Tất cả tỉnh thành" : "All provinces") : selectedProvince}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-warm-450 opacity-60 shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                <DropdownMenuRadioGroup value={selectedProvince} onValueChange={setSelectedProvince}>
                  {provinces.map((p) => (
                    <DropdownMenuRadioItem key={p} value={p} className="text-xs font-semibold text-warm-900 cursor-pointer">{p}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Brand */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3 py-2.5 h-9 shadow-sm min-w-0 sm:min-w-36">
                  <span className="truncate">{selectedBrand === "Tất cả / All" ? (language === "vi" ? "Tất cả thương hiệu" : "All brands") : selectedBrand}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-warm-450 opacity-60 shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                <DropdownMenuRadioGroup value={selectedBrand} onValueChange={setSelectedBrand}>
                  {brands.map((b) => (
                    <DropdownMenuRadioItem key={b} value={b} className="text-xs font-semibold text-warm-900 cursor-pointer">{b}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-xs text-warm-450 font-bold ml-auto whitespace-nowrap">
              {filteredDealers.length} {language === "vi" ? "đại lý" : "dealers"}
            </span>
          </div>
        </div>

        {/* Mobile: List / Map toggle */}
        <div className="flex lg:hidden items-center gap-1 p-1 bg-white border border-warm-200 rounded-xl mb-4 w-fit">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mobileView === "list" ? "bg-warm-900 text-white shadow-sm" : "text-warm-500 hover:text-warm-900"}`}
          >
            <List className="h-3.5 w-3.5" />
            {language === "vi" ? "Danh sách" : "List"}
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mobileView === "map" ? "bg-warm-900 text-white shadow-sm" : "text-warm-500 hover:text-warm-900"}`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            {language === "vi" ? "Bản đồ" : "Map"}
          </button>
        </div>

        {/* Dealer Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Dealer list */}
          <div className={`lg:col-span-5 flex flex-col gap-3 lg:max-h-[600px] lg:overflow-y-auto lg:pr-1 ${mobileView === "map" ? "hidden lg:flex" : "flex"}`}>
            {filteredDealers.length > 0 ? (
              filteredDealers.map((d) => (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleDealerClick(d)}
                  className="bg-white rounded-2xl border border-warm-200/80 p-4 flex flex-col gap-3 justify-between hover:shadow-md hover:border-jotun-teal/30 hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 shadow-sm cursor-pointer text-left"
                >
                  <div className="flex flex-col gap-2">
                    {/* Name + brand badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-sm sm:text-base text-warm-900 leading-snug flex-1">
                        {language === "vi" ? d.name : (d.nameEn || d.name)}
                      </h3>
                      <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${BRAND_COLORS[d.brand] || "bg-warm-50 text-warm-600 border-warm-200"}`}>
                        {d.brand}
                      </span>
                    </div>

                    <p className="text-xs text-warm-600 leading-relaxed flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-jotun-teal shrink-0 mt-0.5" />
                      <span>{language === "vi" ? d.address : (d.addressEn || d.address)}</span>
                    </p>

                    <p className="text-xs text-warm-600 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-jotun-teal shrink-0" />
                      <span className="font-mono font-medium">{d.phone}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 border-t border-warm-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${d.phone}`}
                      className="flex-1 py-2.5 bg-warm-900 hover:bg-warm-800 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{language === "vi" ? "Gọi ngay" : "Call"}</span>
                    </a>
                    <button
                      className="flex-1 py-2.5 border border-warm-200 hover:bg-jotun-teal/5 hover:border-jotun-teal/30 text-warm-700 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      onClick={() => handleDealerClick(d)}
                    >
                      <MapPin className="h-3.5 w-3.5 text-jotun-teal" />
                      <span>{language === "vi" ? "Xem bản đồ" : "View map"}</span>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-warm-50/50 border border-dashed border-warm-200/80 rounded-2xl h-60 flex flex-col items-center justify-center text-center p-6 gap-2">
                <MapPin className="h-8 w-8 text-warm-300 mb-1" />
                <p className="font-serif font-bold text-base text-warm-600">{t.noDealersFound}</p>
                <button
                  onClick={() => { setSelectedProvince("Tất cả / All"); setSelectedBrand("Tất cả / All"); setSearchQuery(""); }}
                  className="text-xs text-jotun-teal font-bold hover:underline mt-1"
                >
                  {language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className={`lg:col-span-7 rounded-2xl border border-black/5 overflow-hidden shadow-sm relative ${mobileView === "list" ? "hidden lg:block" : "block"}`}>
            <div className="h-[360px] sm:h-[440px] lg:h-[600px]">
              <DealerMap dealers={filteredDealers} language={language} viewport={mapViewport} />
            </div>

            {/* Mobile: back to list overlay button */}
            {mobileView === "map" && (
              <button
                onClick={() => setMobileView("list")}
                className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-white text-warm-900 text-xs font-bold rounded-full shadow-lg border border-warm-200 z-10"
              >
                <List className="h-3.5 w-3.5" />
                {language === "vi" ? "Về danh sách" : "Back to list"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
