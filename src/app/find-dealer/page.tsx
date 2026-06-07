"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { ChevronDown, MapPin, Phone, Sparkles, Send, Mail, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Map, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/mapcn-marker-tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

const MOCK_DEALERS: Dealer[] = [
  {
    id: "1",
    name: "Showroom Sơn FLOF Hà Nội",
    nameEn: "FLOF Hanoi Paint Boutique",
    phone: "0243123456",
    email: "hanoi@flof.vn",
    address: "Số 15 Cầu Giấy, Láng Thượng, Cầu Giấy",
    addressEn: "15 Cau Giay, Lang Thuong, Cau Giay",
    province: "Hà Nội",
    district: "Cầu Giấy",
    brand: "Jotun",
    lng: 105.8016,
    lat: 21.0267
  },
  {
    id: "2",
    name: "Trung Tâm Phối Màu Jotun Tây Hồ",
    nameEn: "Tay Ho Jotun Tinting Center",
    phone: "0243789456",
    email: "tayho@flof.vn",
    address: "Số 102 Lạc Long Quân, Bưởi, Tây Hồ",
    addressEn: "102 Lac Long Quan, Buoi, Tay Ho",
    province: "Hà Nội",
    district: "Tây Hồ",
    brand: "Jotun",
    lng: 105.8066,
    lat: 21.0664
  },
  {
    id: "3",
    name: "Đại Lý Sơn Dulux Quận 1",
    nameEn: "Dulux Paint Shop District 1",
    phone: "0283999888",
    email: "q1@flof.vn",
    address: "240 Trần Hưng Đạo, Nguyễn Cư Trinh, Quận 1",
    addressEn: "240 Tran Hung Dao, Nguyen Cu Trinh, District 1",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    brand: "Dulux",
    lng: 106.6894,
    lat: 10.7628
  },
  {
    id: "4",
    name: "Nhà Phân Phối Sơn Jotun Bình Thạnh",
    nameEn: "Binh Thanh Jotun Paint Distributor",
    phone: "0283511222",
    email: "binhthanh@flof.vn",
    address: "45 Điện Biên Phủ, Phường 15, Bình Thạnh",
    addressEn: "45 Dien Bien Phu, Ward 15, Binh Thanh",
    province: "Hồ Chí Minh",
    district: "Bình Thạnh",
    brand: "Jotun",
    lng: 106.7022,
    lat: 10.7992
  },
  {
    id: "5",
    name: "Đại Lý Sơn Nippon Đà Nẵng",
    nameEn: "Nippon Paint Da Nang Shop",
    phone: "02363555777",
    email: "danang@flof.vn",
    address: "98 Nguyễn Văn Linh, Nam Dương, Hải Châu",
    addressEn: "98 Nguyen Van Linh, Nam Duong, Hai Chau",
    province: "Đà Nẵng",
    district: "Hải Châu",
    brand: "Nippon Paint",
    lng: 108.2215,
    lat: 16.0601
  }
];

const PROVINCES = ["Tất cả / All", "Hà Nội", "Hồ Chí Minh", "Đà Nẵng"];
const BRANDS = ["Tất cả / All", "Jotun", "Dulux", "Nippon Paint"];

const BRAND_COLORS: Record<string, string> = {
  "Jotun": "bg-red-50 text-red-600 border-red-100",
  "Dulux": "bg-purple-50 text-purple-600 border-purple-100",
  "Nippon Paint": "bg-blue-50 text-blue-600 border-blue-100",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function FindDealerPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const [dealers, setDealers] = useState<Dealer[]>(MOCK_DEALERS);
  const [selectedProvince, setSelectedProvince] = useState("Tất cả / All");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả / All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const [mapViewport, setMapViewport] = useState({
    center: [105.787, 21.027] as [number, number],
    zoom: 11,
    bearing: 0,
    pitch: 0
  });

  useEffect(() => {
    setMounted(true);

    const storedDealers = localStorage.getItem("sonvn-dealers");
    if (storedDealers) {
      try {
        const parsed = JSON.parse(storedDealers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDealers(parsed);
          return; // Skip loading from API to preserve user's local edits made in Admin
        }
      } catch (e) { }
    }

    // Load active dealers from database API (runs only once to initialize LocalStorage if empty)
    fetch("/api/dealers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDealers(data);
          localStorage.setItem("sonvn-dealers", JSON.stringify(data));
        }
      })
      .catch((err) => console.error("Error loading dealers from DB API:", err));
  }, []);

  useEffect(() => {
    if (selectedProvince === "Hà Nội") {
      setMapViewport({
        center: [105.787, 21.027],
        zoom: 11,
        bearing: 0,
        pitch: 0
      });
    } else if (selectedProvince === "Hồ Chí Minh") {
      setMapViewport({
        center: [106.735, 10.81],
        zoom: 11,
        bearing: 0,
        pitch: 0
      });
    } else if (selectedProvince === "Đà Nẵng") {
      setMapViewport({
        center: [108.2215, 16.0601],
        zoom: 11,
        bearing: 0,
        pitch: 0
      });
    }
  }, [selectedProvince]);

  const handleDealerClick = (dl: Dealer) => {
    setMapViewport({
      center: [dl.lng, dl.lat],
      zoom: 13.5,
      bearing: 0,
      pitch: 0
    });
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
      {/* Page Header — Editorial Split Layout (Image 1 Style) */}
      <section className="relative w-full pt-20 pb-16 md:pt-24 md:pb-20 overflow-hidden bg-jotun-ivory text-left border-b border-black/5">
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 xl:px-16 items-center grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
          
          {/* Left Column: Premium Showroom Image (7 cols) - Animated */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 relative flex justify-center items-center"
          >
            <div className="relative w-full max-w-[620px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-black/5 bg-white">
              <Image
                src="/showroom_hero.png"
                alt={language === "vi" ? "Showroom sơn cao cấp" : "Premium Paint Showroom"}
                fill
                className="object-cover transition-transform duration-700 hover:scale-103"
                priority
              />
            </div>
          </motion.div>

          {/* Right Column: Text Content (5 cols) - Animated */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-5 flex flex-col gap-6 items-start justify-center text-left"
          >
            <h1
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-serif font-bold text-warm-900 tracking-tight"
              style={{ lineHeight: 1.35 }}
            >
              {language === "vi" ? (
                <>Tìm Đại Lý Sơn <br /><span className="font-normal italic text-jotun-teal">Gần Nhất</span></>
              ) : (
                <>Find Our Nearest <br /><span className="font-normal italic text-jotun-teal">Dealer</span></>
              )}
            </h1>
            <p className="text-sm text-warm-650 leading-relaxed font-light">
              {language === "vi"
                ? "Tìm kiếm các đại lý ủy quyền chính hãng của Jotun, Dulux và Nippon trên toàn quốc. Nhận tư vấn trực tiếp từ đội ngũ chuyên gia để chọn dòng sơn chất lượng cao nhất cho tổ ấm của bạn."
                : "Search authorized Jotun, Dulux, and Nippon paint dealers nationwide based on your location. Get direct advice from experts to select the absolute highest quality paint lines for your home."}
            </p>

            <div className="flex flex-col gap-3 text-xs font-semibold text-warm-600 border-l border-[#88734C]/30 pl-4 py-1">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-jotun-teal shrink-0" />
                {language === "vi" ? "Cam kết 100% sơn chính hãng ủy quyền" : "100% genuine authorized paint guarantee"}
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-jotun-teal shrink-0" />
                {language === "vi" ? "Bảng giá niêm yết công khai rõ ràng" : "Public and transparent pricing"}
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-jotun-teal shrink-0" />
                {language === "vi" ? "Hỗ trợ pha màu máy vi tính tự động" : "Computerized automatic tinting support"}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Centered Transition Banner (Image 1 Style) - Animated */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="py-12 bg-white border-b border-black/5"
      >
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 text-center">
          <p className="text-warm-600 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-light">
            {language === "vi"
              ? "Trải nghiệm dịch vụ chuyên nghiệp tại mạng lưới đại lý ủy quyền. Lựa chọn màu sắc, nhận tư vấn kỹ thuật và ước lượng khối lượng sơn cần thiết cho dự án của bạn."
              : "Experience professional services at our authorized dealer network. Select colors, receive technical advice, and estimate the paint volume needed for your project."}
          </p>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-10"
      >
        {/* Filter bar */}
        <div className="bg-white border border-warm-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder={t.dealerSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-bold text-warm-450 uppercase pl-1">{t.selectProvince}</span>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left min-w-44"
                  >
                    <span className="truncate">{selectedProvince}</span>
                    <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                  <DropdownMenuRadioGroup value={selectedProvince} onValueChange={setSelectedProvince}>
                    {PROVINCES.map((p) => (
                      <DropdownMenuRadioItem
                        key={p}
                        value={p}
                        className="text-xs font-semibold text-warm-900 cursor-pointer"
                      >
                        {p}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-bold text-warm-450 uppercase pl-1">{t.selectBrand}</span>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left min-w-44"
                  >
                    <span className="truncate">{selectedBrand}</span>
                    <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                  <DropdownMenuRadioGroup value={selectedBrand} onValueChange={setSelectedBrand}>
                    {BRANDS.map((b) => (
                      <DropdownMenuRadioItem
                        key={b}
                        value={b}
                        className="text-xs font-semibold text-warm-900 cursor-pointer"
                      >
                        {b}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span className="text-xs text-warm-450 font-bold self-end pb-2.5">
              {filteredDealers.length} {language === "vi" ? "đại lý" : "dealers"}
            </span>
          </div>
        </div>

        {/* Dealer Split View (List + Map) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-8">
          {/* Left: Dealer list (5 cols) - Static (No Animation) */}
          <div className="lg:col-span-5 flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-warm-200">
            {filteredDealers.length > 0 ? (
              filteredDealers.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleDealerClick(d)}
                  className="bg-white rounded-2xl border border-warm-200/80 p-5 flex flex-col gap-4 justify-between hover:shadow-md hover:border-jotun-teal/30 hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 shadow-sm cursor-pointer text-left"
                >
                  <div className="flex flex-col gap-3">
                    <h3 className="font-serif font-bold text-base text-warm-900">
                      {language === "vi" ? d.name : (d.nameEn || d.name)}
                    </h3>

                    <p className="text-xs text-warm-650 leading-relaxed flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-jotun-teal shrink-0 mt-0.5" />
                      <span>{language === "vi" ? d.address : (d.addressEn || d.address)}</span>
                    </p>

                    <p className="text-xs text-warm-650 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-jotun-teal shrink-0" />
                      <span className="font-mono font-medium">{d.phone}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 border-t border-warm-100 pt-4" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${d.phone}`}
                      className="flex-1 py-2 bg-warm-900 hover:bg-warm-850 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{t.callDealer}</span>
                    </a>
                    <button
                      className="flex-1 py-2 border border-warm-200 hover:bg-warm-50/50 text-warm-750 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      onClick={() => handleDealerClick(d)}
                    >
                      <MapPin className="h-3.5 w-3.5 text-jotun-teal" />
                      <span>{language === "vi" ? "Định vị" : "Locate"}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-warm-50/50 border border-dashed border-warm-200/80 rounded-2xl h-72 flex flex-col items-center justify-center text-center p-6 gap-2">
                <p className="font-serif font-bold text-lg text-warm-450 uppercase tracking-wider">
                  {language === "vi" ? "Đại Lý" : "Dealers"}
                </p>
                <p className="text-warm-600 font-medium">{t.noDealersFound}</p>
              </div>
            )}
          </div>

          {/* Right: Live Interactive Map (7 cols) - Static (No Animation) */}
          <div className="lg:col-span-7 min-h-[500px] rounded-2xl border border-black/5 overflow-hidden shadow-sm relative">
            <Map viewport={mapViewport}>
              {filteredDealers.map((dl) => (
                <MapMarker
                  key={dl.id}
                  longitude={dl.lng}
                  latitude={dl.lat}
                >
                  <MarkerContent>
                    <div className="size-6 rounded-full border-2 border-white bg-jotun-teal shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                      <MapPin className="size-3.5 text-white" />
                    </div>
                  </MarkerContent>
                  <MarkerTooltip>
                    <div className="p-2 max-w-[220px] text-left">
                      <p className="font-bold text-xs mb-1 text-warm-900">{language === "vi" ? dl.name : (dl.nameEn || dl.name)}</p>
                      <p className="text-[10px] text-warm-600 leading-tight mb-1">{language === "vi" ? dl.address : (dl.addressEn || dl.address)}</p>
                      <p className="text-[9px] text-warm-500 font-mono">{language === "vi" ? "Hotline" : "Phone"}: {dl.phone}</p>
                    </div>
                  </MarkerTooltip>
                </MapMarker>
              ))}
            </Map>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
