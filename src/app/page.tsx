"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { ArrowRight, MapPin, Star, Check, Heart, ChevronLeft, ChevronRight, ChevronDown, PaintBucket, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";
import { MOCK_PAINTS, MOCK_COLORS, MOCK_SUPPLIERS, Paint, MOCK_BLOGS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import AboutUsSection from "@/components/ui/about-us-section";
import { Map, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/mapcn-marker-tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";


// Color Families matching Image 1
const COLOR_FAMILIES = [
  { id: "white", name: "Trắng", nameEn: "White", hex: "#F7F6F2", desc: "Thanh khiết, dịu nhẹ và ngập tràn ánh sáng", descEn: "Pure, gentle and filled with natural light" },
  { id: "grey", name: "Xám & Đen", nameEn: "Grey & Black", hex: "#6E6E6E", desc: "Hiện đại, tối giản và chiều sâu tĩnh lặng", descEn: "Modern, minimalist and quiet depth" },
  { id: "beige", name: "Be & Nâu", nameEn: "Beige & Brown", hex: "#C6BAA9", desc: "Ấm cúng, mộc mạc và thanh lịch tự nhiên", descEn: "Cozy, rustic and natural elegance" },
  { id: "peach", name: "Cam Đào & Cam", nameEn: "Peach & Orange", hex: "#C7A687", desc: "Trẻ trung, tươi mới và ngập tràn năng lượng", descEn: "Youthful, fresh and full of energy" },
  { id: "red", name: "Đỏ & Hồng", nameEn: "Red & Pink", hex: "#976256", desc: "Quyến rũ, ấm áp và tạo điểm nhấn ấn tượng", descEn: "Charming, warm and creating bold accents" },
  { id: "purple", name: "Tím", nameEn: "Purple", hex: "#9896A0", desc: "Mơ mộng, huyền bí và đầy chất nghệ thuật", descEn: "Dreamy, mysterious and artistic" },
  { id: "blue", name: "Xanh Dương", nameEn: "Blue", hex: "#B4C3CD", desc: "Yên bình, thư thái và phóng khoáng bao la", descEn: "Peaceful, relaxing and vast freedom" },
  { id: "green", name: "Xanh Lá", nameEn: "Green", hex: "#7E9D73", desc: "Gần gũi thiên nhiên, mát lành và thư thái", descEn: "Nature-inspired, fresh and relaxing" },
  { id: "yellow", name: "Vàng", nameEn: "Yellow", hex: "#F2E2A6", desc: "Năng động, ấm áp và khơi nguồn sáng tạo", descEn: "Dynamic, warm and inspiring creativity" }
];

// Swatches dataset corresponding to color families (Image 1 & 3)
const COLOR_SWATCHES = [
  // White
  { code: "0001", name: "Imagine", nameEn: "Imagine", hex: "#D6E3DB", family: "white" },
  { code: "1001", name: "Trắng Ngà", nameEn: "Ivory White", hex: "#F5F0E8", family: "white" },
  { code: "1002", name: "Trắng Sữa", nameEn: "Milk White", hex: "#FFF8F0", family: "white" },
  // Green
  { code: "7543", name: "Dusty Green", nameEn: "Dusty Green", hex: "#94A396", family: "green" },
  { code: "7686", name: "Mindful Green", nameEn: "Mindful Green", hex: "#778579", family: "green" },
  { code: "8002", name: "Xanh Rêu", nameEn: "Moss Green", hex: "#5C6B5E", family: "green" },
  // Beige
  { code: "2001", name: "Kem Vani", nameEn: "Vanilla Cream", hex: "#F3E5D0", family: "beige" },
  { code: "2002", name: "Be Cát", nameEn: "Desert Sand", hex: "#D4C4A8", family: "beige" },
  // Grey
  { code: "3004", name: "Xám Sương Mù", nameEn: "Mist Grey", hex: "#E2E5E6", family: "grey" },
  { code: "3003", name: "Xám Than", nameEn: "Charcoal Grey", hex: "#4A4A4A", family: "grey" },
  // Blue
  { code: "7002", name: "Xanh Chiều", nameEn: "Afternoon Blue", hex: "#AEC6CF", family: "blue" },
  { code: "7003", name: "Xanh Teal", nameEn: "Teal Blue", hex: "#008080", family: "blue" },
  // Orange
  { code: "5002", name: "Cam Đất Ấm", nameEn: "Terracotta", hex: "#CC7722", family: "peach" },
  // Yellow
  { code: "4002", name: "Vàng Nắng", nameEn: "Sunny Gold", hex: "#FFD93D", family: "yellow" },
  // Red
  { code: "6002", name: "Đỏ Gạch", nameEn: "Brick Red", hex: "#CB4154", family: "red" },
  // Purple
  { code: "6005", name: "Tím Oải Hương", nameEn: "Lavender", hex: "#D1C4E9", family: "purple" }
];

// Room Visualizer Templates (Image 3 layout)
const VISUALIZER_ROOMS = [
  {
    id: "living",
    name: "Phòng Khách",
    nameEn: "Living Room",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
    hotspots: [
      { id: "wallMain", top: "25%", left: "67%", label: "Tường chính", labelEn: "Main Wall" },
      { id: "wallMain", top: "47%", left: "57%", label: "Cột tường", labelEn: "Wall Column" },
      { id: "wallAccent", top: "63%", left: "65%", label: "Tường nhấn", labelEn: "Accent Wall" }
    ],
    wallPolygon: "polygon(0 0, 45% 0, 45% 100%, 0 100%)",
    accentPolygon: "polygon(45% 0, 100% 0, 100% 100%, 45% 100%)",
  },
  {
    id: "bedroom",
    name: "Phòng Ngủ",
    nameEn: "Bedroom",
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200",
    hotspots: [
      { id: "wallMain", top: "50%", left: "35%", label: "Tường chính", labelEn: "Main Wall" },
      { id: "wallAccent", top: "40%", left: "80%", label: "Tường nhấn", labelEn: "Accent Wall" }
    ],
    wallPolygon: "polygon(0 0, 55% 0, 55% 100%, 0 100%)",
    accentPolygon: "polygon(55% 0, 100% 0, 100% 100%, 55% 100%)",
  },
  {
    id: "facade",
    name: "Mặt Tiền Nhà",
    nameEn: "House Facade",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
    hotspots: [
      { id: "wallMain", top: "55%", left: "30%", label: "Cột & Tường chính", labelEn: "Main Column & Wall" },
      { id: "wallAccent", top: "48%", left: "65%", label: "Mảng tường nhấn", labelEn: "Accent Wall Panel" }
    ],
    wallPolygon: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
    accentPolygon: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
  }
];

// Product categories
const PRODUCT_CATEGORIES = [
  { id: "cat-1", name: "Sơn Nội Thất", nameEn: "Interior Paint", desc: "Màng sơn láng mịn, lau chùi tối đa, an toàn sức khỏe.", descEn: "Smooth finish, maximum washability, and health-safe.", slug: "son-noi-that", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600" },
  { id: "cat-2", name: "Sơn Ngoại Thất", nameEn: "Exterior Paint", desc: "Chống kiềm hóa, cản nắng làm mát, chống rêu mốc tối đa.", descEn: "Alkali-resistant, sun-reflecting, and maximum mold protection.", slug: "son-ngoai-that", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600" },
  { id: "cat-3", name: "Sơn Chống Thấm", nameEn: "Waterproofing", desc: "Màng bảo vệ đàn hồi co giãn chặn đứng dòng nước ẩm mốc.", descEn: "Elastomeric shield to block moisture and water damage.", slug: "son-chong-tham", image: "https://images.unsplash.com/photo-1542013936693-8848e574047a?q=80&w=600" },
  { id: "cat-4", name: "Sơn Lót Kháng Kiềm", nameEn: "Alkali Primers", desc: "Tăng cường độ bám và bảo vệ độ phẳng bóng mượt của màu phủ.", descEn: "Enhances adhesion and protects topcoat smoothness.", slug: "son-lot", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600" },
];

// Highlight/Featured Products
const FEATURED_PRODUCTS = [
  // Bestsellers
  {
    id: "paint-1",
    name: "Majestic Đẹp Hoàn Hảo (Bóng)",
    nameEn: "Majestic Perfect Beauty (Gloss)",
    price: 950000,
    rating: 5,
    tag: "bestseller",
    vol: "5L",
    desc: "Màu sắc rực rỡ sắc nét, dễ lau chùi vượt trội.",
    descEn: "Vibrant colors, sharp definition, and outstanding easy clean.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  },
  {
    id: "paint-3",
    name: "Dulux Ambiance 5 in 1 Siêu Bóng",
    nameEn: "Dulux Ambiance 5 in 1 Super Gloss",
    price: 1100000,
    rating: 5,
    tag: "bestseller",
    vol: "5L",
    desc: "Bề mặt siêu láng mịn và những gam màu sắc nét độc đáo.",
    descEn: "Super smooth surface and unique sharp colors.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#AEC6CF"]
  },
  {
    id: "paint-5",
    name: "Sơn Nội Thất Siêu Cấp TOA SuperShield",
    nameEn: "TOA SuperShield Ultra Premium Interior",
    price: 750000,
    rating: 5,
    tag: "bestseller",
    vol: "5L",
    desc: "Công nghệ tự làm sạch tiên tiến chống bám bẩn vượt trội.",
    descEn: "Self-cleaning technology for superior dirt resistance.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  },
  // New Products
  {
    id: "paint-7",
    name: "Jotashield Bền Màu Tối Ưu",
    nameEn: "Jotashield Extreme Color Protection",
    price: 1350000,
    rating: 5,
    tag: "new",
    vol: "5L",
    desc: "Bảo vệ 12 năm bất chấp khí hậu khắc nghiệt vùng nhiệt đới.",
    descEn: "12-year protection against harsh tropical climates.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400",
    colors: ["#E2E5E6", "#4A6741", "#6F4E37"]
  },
  {
    id: "paint-9",
    name: "Nippon WeatherGard Siêu Bóng",
    nameEn: "Nippon WeatherGard Super Gloss",
    price: 1180000,
    rating: 5,
    tag: "new",
    vol: "5L",
    desc: "Bảo vệ kết cấu bê tông tuyệt vời trước mưa bão và ô nhiễm.",
    descEn: "Protects concrete walls from heavy rain and pollution.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#C0C0C0"]
  },
  {
    id: "paint-11",
    name: "Kansai Alushield Chống Phai Màu",
    nameEn: "Kansai Alushield Extreme Weather",
    price: 1050000,
    rating: 5,
    tag: "new",
    vol: "5L",
    desc: "Sơn ngoại thất siêu cấp, kháng tia cực tím tối ưu.",
    descEn: "Premium exterior paint, preventing UV damage.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  },
  // Promo Products
  {
    id: "paint-8",
    name: "Dulux Weathershield Bóng",
    nameEn: "Dulux Weathershield Gloss",
    price: 1280000,
    rating: 4,
    tag: "promo",
    vol: "5L",
    desc: "Công nghệ Active Guard chống phai màu, làm mát nhà.",
    descEn: "Active Guard fade resistance, cooling house technology.",
    image: "https://images.unsplash.com/photo-1542013936693-8848e574047a?q=80&w=400",
    colors: ["#FFFFFF", "#FFF8F0", "#AEC6CF"]
  },
  {
    id: "paint-4",
    name: "Nippon Odour-less Chùi Rửa Vượt Trội",
    nameEn: "Nippon Odour-less Premium Washable",
    price: 850000,
    rating: 4,
    tag: "promo",
    vol: "5L",
    desc: "Không mùi, hàm lượng VOC rất thấp, thân thiện môi trường.",
    descEn: "Odorless, low VOC, eco-friendly and safe for health.",
    image: "https://images.unsplash.com/photo-1542013936693-8848e574047a?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#AEC6CF"]
  },
  {
    id: "paint-10",
    name: "TOA NanoShield Bóng",
    nameEn: "TOA NanoShield Gloss Exterior",
    price: 990000,
    rating: 4,
    tag: "promo",
    vol: "5L",
    desc: "Chống thấm nước vượt trội và chống bám bẩn tự động.",
    descEn: "Extreme water resistance and self-cleaning.",
    image: "https://images.unsplash.com/photo-1542013936693-8848e574047a?q=80&w=400",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  }
];


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

export default function HomePage() {
  const { language } = useLanguageStore();
  const addItem = useCartStore((state) => state.addItem);

  // States
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"bestseller" | "new" | "promo">("bestseller");

  // Color family picker state (Image 1)
  const [selectedFamily, setSelectedFamily] = useState<string>("white");
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Room Visualizer State (Image 3)
  const [visRoomId, setVisRoomId] = useState("living");
  const [visPart, setVisPart] = useState<"wallMain" | "wallAccent">("wallMain");
  const [visWallMainColor, setVisWallMainColor] = useState("#D6E3DB"); // Imagine
  const [visWallAccentColor, setVisWallAccentColor] = useState("#778579"); // Mindful Green

  // Before/After Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderWidth, setSliderWidth] = useState(800);
  const swatchesRef = useRef<HTMLDivElement>(null);

  const scrollSwatches = (direction: "left" | "right") => {
    if (swatchesRef.current) {
      const scrollAmount = 300;
      swatchesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };



  // Dealer State



  const [paints, setPaints] = useState<Paint[]>(MOCK_PAINTS);

  useEffect(() => {
    setMounted(true);
    const storedPaints = localStorage.getItem("sonvn-paints");
    if (storedPaints) {
      try {
        setPaints(JSON.parse(storedPaints));
      } catch (e) { }
    } else {
      localStorage.setItem("sonvn-paints", JSON.stringify(MOCK_PAINTS));
    }

    const saved = localStorage.getItem("sonvn-color-wishlist");
    if (saved) {
      try { setWishlist(JSON.parse(saved)); } catch (e) { }
    }

    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.getBoundingClientRect().width);
    }
    const handleResize = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.getBoundingClientRect().width);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const toggleWishlist = (code: string) => {
    let newWish: string[];
    if (wishlist.includes(code)) {
      newWish = wishlist.filter(c => c !== code);
      toast.info(language === "vi" ? "Đã xóa màu khỏi mục yêu thích" : "Removed color from favorites");
    } else {
      newWish = [...wishlist, code];
      toast.success(language === "vi" ? "Đã thêm màu vào mục yêu thích" : "Added color to favorites");
    }
    setWishlist(newWish);
    localStorage.setItem("sonvn-color-wishlist", JSON.stringify(newWish));
  };

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
  };



  const handleAddToCart = (prod: any) => {
    const paint = paints.find((p) => p.id === prod.id);
    if (!paint) {
      toast.error("Không tìm thấy sản phẩm / Product not found");
      return;
    }

    const defaultColor = MOCK_COLORS.find((c) => c.code === "0001") || {
      id: "col-1",
      code: "0001",
      name: "Trắng Tinh Khôi",
      nameEn: "Pure White",
      hex: "#FFFFFF"
    };

    addItem(paint, 1, defaultColor);

    toast.success(
      language === "vi"
        ? `Đã thêm ${prod.name} vào giỏ hàng`
        : `Added ${prod.nameEn || prod.name} to cart`
    );
  };

  if (!mounted) return null;

  const activeRoom = VISUALIZER_ROOMS.find((r) => r.id === visRoomId) || VISUALIZER_ROOMS[0];
  const filteredSwatches = COLOR_SWATCHES.filter(c => c.family === selectedFamily);

  return (
    <div className="relative w-full overflow-hidden bg-jotun-ivory text-warm-900 transition-colors duration-300">

      {/* 1. HERO SECTION — Editorial Split Layout */}
      <section className="relative w-full pt-32 pb-24 md:py-32 overflow-hidden bg-jotun-ivory">
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

        <div className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left Text Column */}
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 flex flex-col gap-6 text-left items-start"
          >
            <motion.h1
              variants={heroItemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight leading-tight text-warm-955"
            >
              {language === "vi" ? (
                <>Kiến tạo không gian sống <br /><span className="font-normal italic text-jotun-teal">Đậm chất nghệ thuật</span></>
              ) : (
                <>Creating living spaces <br /><span className="font-normal italic text-jotun-teal">Full of artistic flavor</span></>
              )}
            </motion.h1>

            <motion.p
              variants={heroItemVariants}
              className="text-warm-600 text-base md:text-lg font-light leading-relaxed max-w-xl"
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
            <div className="relative h-[420px] sm:h-[600px] lg:h-[650px] w-full overflow-hidden bg-white shadow-2xl rounded-3xl border border-black/5 max-w-[960px]">
              <Image
                src="/hero_bg.png"
                alt={language === "vi" ? "Không gian sống cao cấp" : "Premium living space"}
                fill
                className="object-cover transition-transform duration-1000 hover:scale-103"
                priority
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* 1.5 PROMOTION SECTION — Premium Double-Bezel Showcase */}
      <section className="py-32 bg-jotun-ivory-100 border-b border-black/5">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Product Shoot Card */}
            <div className="lg:col-span-5 relative h-[520px] w-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-jotun-teal/5 to-transparent rounded-2xl -z-10" />
              <div className="relative w-full max-w-[480px] h-[480px] bg-white rounded-[2.5rem] border border-black/5 flex items-center justify-center p-2 shadow-2xl">
                <Image
                  src="/product_interior.png"
                  alt="Majestic Premium Paint"
                  fill
                  className="object-contain p-2 transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Promo Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left gap-6">

              <h2 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-warm-900 leading-tight">
                {language === "vi" ? (
                  <>Majestic Đẹp Nguyên Bản — <br /><span className="text-jotun-teal italic">Sắc Sảo & Láng Mịn</span></>
                ) : (
                  <>Majestic Pure Beauty — <br /><span className="text-jotun-teal italic">Sharp & Smooth Finish</span></>
                )}
              </h2>
              <p className="text-base text-warm-600 leading-relaxed max-w-2xl">
                {language === "vi"
                  ? "Phiên bản sơn nội thất Majestic mới nhất định hình tiêu chuẩn sang trọng cho ngôi nhà của bạn. Với công nghệ tạo màu sắc rực rỡ sắc nét và khả năng lau chùi vượt trội, Majestic bảo vệ không gian sống trong lành, kháng khuẩn và bền bỉ tối đa."
                  : "The latest Majestic interior paint sets a new standard of luxury for your home. With vivid color technology and superior washability, Majestic protects clean, antibacterial, and maximally durable living spaces."
                }
              </p>
              <Link
                href="/products/jotun-majestic-dep-hoan-hao-bong-5l"
                className="btn-island bg-warm-900 hover:bg-warm-800 text-white text-sm px-6 py-3.5 mt-2"
              >
                <span>{language === "vi" ? "Tìm hiểu sản phẩm" : "Explore product"}</span>
                <span className="btn-island-icon bg-white/10">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. KHÁM PHÁ MÀU SẮC CỦA CHÚNG TÔI */}
      <section id="color-explorer-section" className="py-28 bg-white from-[#F2F2EB] to-[#F8F8F2] relative overflow-hidden">
        {/* Parallax/floating decorative elements inspired by AboutUsSection */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#88734C]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#A9BBC8]/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-12 w-3 h-3 rounded-full bg-[#88734C]/30 animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/3 right-12 w-4 h-4 rounded-full bg-[#A9BBC8]/30 animate-pulse pointer-events-none" />

        <div className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center mb-16 text-center"
          >
            <motion.span
              className="text-[#88734C] font-semibold text-xs tracking-widest mb-3 flex items-center gap-2 uppercase"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <PaintBucket className="w-4 h-4 text-[#88734C]" />
              {language === "vi" ? "SẮC MÀU THỜI THƯỢNG" : "TRENDING PALETTE"}
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-warm-900 mb-2 leading-tight">
              {language === "vi" ? "Khám Phá Màu Sắc Của Chúng Tôi" : "Explore Our Paint Colors"}
            </h2>
            <motion.div
              className="w-24 h-1 bg-[#88734C] mx-auto mt-3 mb-6"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <p className="text-warm-550 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {language === "vi"
                ? "Duyệt nhóm màu sắc thời thượng bên dưới và tương tác phối màu trực quan"
                : "Browse trending color families below and interact with color visualizer"}
            </p>
          </motion.div>

          {/* 3-Column Services-style Layout inspired by About Us Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-stretch mb-20">
            {/* Left Column: First 4 Color Families */}
            <div className="lg:col-span-4 flex flex-col justify-center gap-6">
              {COLOR_FAMILIES.slice(0, 4).map((family) => {
                const isSelected = selectedFamily === family.id;
                return (
                  <motion.div
                    key={family.id}
                    onClick={() => setSelectedFamily(family.id)}
                    className={cn(
                      "flex flex-col p-5 rounded-2xl border transition-all duration-500 cursor-pointer group relative",
                      isSelected
                        ? "bg-white border-[#88734C] shadow-lg"
                        : "bg-white/40 border-warm-200/50 hover:bg-white/80 hover:border-warm-300 hover:shadow-xs"
                    )}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className={cn(
                        "p-1 rounded-full transition-all duration-500",
                        isSelected ? "bg-[#88734C] ring-2 ring-[#88734C]/25" : "bg-black/[0.04]"
                      )}>
                        <div className="p-0.5 rounded-full bg-white">
                          <span
                            className="w-10 h-10 rounded-full block border border-black/5 shadow-inner transition-transform duration-500 group-hover:scale-110"
                            style={{ backgroundColor: family.hex }}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-base md:text-lg font-serif font-bold transition-colors duration-300",
                          isSelected ? "text-[#88734C]" : "text-warm-900 group-hover:text-[#88734C]"
                        )}>
                          {language === "vi" ? family.name : family.nameEn}
                        </h3>
                        <span className="text-[9px] font-mono text-warm-400 uppercase tracking-widest">
                          {family.id}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-warm-500 leading-relaxed pl-14">
                      {language === "vi" ? family.desc : family.descEn}
                    </p>
                    {isSelected && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#88734C] hidden lg:block animate-pulse">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Center Column: Featured Room Mockup with Double-Bezel and floating elements */}
            <div className="lg:col-span-4 flex justify-center items-center py-6 lg:py-0">
              <motion.div
                className="relative w-full max-w-xs md:max-w-sm lg:max-w-xs"
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="bezel-outer">
                  <div className="bezel-inner relative overflow-hidden aspect-[3/4] shadow-2xl group/center">
                    <img
                      src={
                        selectedFamily === "green"
                          ? "/living_sage.png"
                          : selectedFamily === "beige"
                            ? "/living_beige.png"
                            : selectedFamily === "blue"
                              ? "/living_p5.png"
                              : selectedFamily === "grey"
                                ? "/living_grey.png"
                                : selectedFamily === "yellow"
                                  ? "/living_p6.png"
                                  : selectedFamily === "red"
                                    ? "/living_terracotta.png"
                                    : selectedFamily === "peach"
                                      ? "/living_terracotta.png"
                                      : selectedFamily === "purple"
                                        ? "/living_grey.png"
                                        : "/living_sage.png" // white / default
                      }
                      alt="Interior Mockup"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover/center:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-warm-950/70 via-warm-950/10 to-transparent flex flex-col justify-end p-6 text-left">
                      <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest mb-1">
                        {language === "vi" ? "PHỐI MÀU GỢI Ý" : "SUGGESTED COMBINATION"}
                      </span>
                      <h4 className="text-white font-serif font-bold text-lg md:text-xl mb-4 leading-tight">
                        {language === "vi"
                          ? `Không Gian Tông ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.name}`
                          : `${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.nameEn} Palette Space`
                        }
                      </h4>
                      <Link
                        href="#visualizer-section"
                        className="bg-white text-warm-900 hover:bg-warm-100 transition-colors px-4 py-2.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold shadow-md w-full"
                        onClick={(e) => {
                          const el = document.getElementById("visualizer-section");
                          if (el) {
                            e.preventDefault();
                            el.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        <span>{language === "vi" ? "Thử màu trực quan" : "Try in Visualizer"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Double Border Offset Frame */}
                <div className="absolute inset-0 border border-[#88734C]/40 rounded-[2rem] -m-3 z-[-1] pointer-events-none" />

                {/* Floating decorative elements */}
                <div className="absolute -top-4 -right-6 w-12 h-12 rounded-full bg-[#88734C]/10 blur-xs pointer-events-none animate-pulse" />
                <div className="absolute -bottom-6 -left-8 w-16 h-16 rounded-full bg-[#A9BBC8]/15 blur-xs pointer-events-none animate-pulse" />
              </motion.div>
            </div>

            {/* Right Column: Remaining 5 Color Families */}
            <div className="lg:col-span-4 flex flex-col justify-center gap-6">
              {COLOR_FAMILIES.slice(4).map((family) => {
                const isSelected = selectedFamily === family.id;
                return (
                  <motion.div
                    key={family.id}
                    onClick={() => setSelectedFamily(family.id)}
                    className={cn(
                      "flex flex-col p-5 rounded-2xl border transition-all duration-500 cursor-pointer group relative",
                      isSelected
                        ? "bg-white border-[#88734C] shadow-lg"
                        : "bg-white/40 border-warm-200/50 hover:bg-white/80 hover:border-warm-300 hover:shadow-xs"
                    )}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className={cn(
                        "p-1 rounded-full transition-all duration-500",
                        isSelected ? "bg-[#88734C] ring-2 ring-[#88734C]/25" : "bg-black/[0.04]"
                      )}>
                        <div className="p-0.5 rounded-full bg-white">
                          <span
                            className="w-10 h-10 rounded-full block border border-black/5 shadow-inner transition-transform duration-500 group-hover:scale-110"
                            style={{ backgroundColor: family.hex }}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-base md:text-lg font-serif font-bold transition-colors duration-300",
                          isSelected ? "text-[#88734C]" : "text-warm-900 group-hover:text-[#88734C]"
                        )}>
                          {language === "vi" ? family.name : family.nameEn}
                        </h3>
                        <span className="text-[9px] font-mono text-warm-400 uppercase tracking-widest">
                          {family.id}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-warm-500 leading-relaxed pl-14">
                      {language === "vi" ? family.desc : family.descEn}
                    </p>
                    {isSelected && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#88734C] hidden lg:block animate-pulse">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Swatches & Products Combined Dashboard Panel */}
          <div className="bg-white/45 backdrop-blur-md border border-warm-200/50 rounded-3xl p-6 md:p-8 mt-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

              {/* Left Column (7/12): Color Swatches Grid */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col items-start text-left mb-6">
                    <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {language === "vi" ? "SẮC ĐỘ HIỆN ĐẠI" : "MODERN SHADES"}
                    </span>
                    <h3 className="font-serif font-bold text-xl md:text-2xl text-warm-900">
                      {language === "vi"
                        ? `Bảng Mã Màu ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.name}`
                        : `${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.nameEn} Swatches`
                      }
                    </h3>
                    <p className="text-[11px] text-warm-500 mt-1">
                      {language === "vi"
                        ? "Bấm vào thẻ màu để phối màu chính cho mô hình phòng trực quan bên dưới"
                        : "Click a swatch card to set as main color for room visualizer below"}
                    </p>
                  </div>

                  <motion.div
                    key={selectedFamily}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.05 }}
                    variants={{
                      visible: { transition: { staggerChildren: 0.03 } }
                    }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    {filteredSwatches.map((swatch) => {
                      const isFav = wishlist.includes(swatch.code);
                      return (
                        <motion.div
                          key={swatch.code}
                          variants={{
                            hidden: { opacity: 0, y: 16 },
                            visible: { opacity: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.5 } }
                          }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          onClick={() => {
                            setVisWallMainColor(swatch.hex);
                            toast.success(
                              language === "vi"
                                ? `Đã chọn màu ${swatch.name} cho Visualizer!`
                                : `Selected ${swatch.nameEn || swatch.name} for Visualizer!`
                            );
                          }}
                          className="border border-warm-200/80 rounded-2xl hover:border-[#88734C]/40 bg-white p-3 flex flex-col gap-3 relative transition-all duration-300 hover:shadow-md cursor-pointer group"
                        >
                          <div
                            className="h-28 rounded-xl border border-black/5 flex items-center justify-center relative shadow-inner overflow-hidden"
                            style={{ backgroundColor: swatch.hex }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(swatch.code);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-white rounded-full text-warm-400 hover:text-rose-500 transition-colors shadow-xs z-10"
                            >
                              <Heart className={cn("h-3 w-3", isFav ? "fill-rose-500 text-rose-500" : "")} />
                            </button>
                          </div>
                          <div className="text-left">
                            <span className="text-[9px] font-mono font-bold text-warm-400 block">
                              {language === "vi" ? "Mã:" : "Code:"} {swatch.code}
                            </span>
                            <h4 className="text-xs font-bold text-warm-750 truncate group-hover:text-[#88734C] transition-colors mt-0.5">
                              {language === "vi" ? swatch.name : swatch.nameEn}
                            </h4>
                            <div className="w-6 h-0.5 bg-transparent mt-2 group-hover:bg-[#88734C] group-hover:w-12 transition-all duration-300" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>

              {/* Right Column (5/12): Suggested Paint Products (Vertical List of Compact Cards) */}
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-warm-200/60 pt-8 lg:pt-0 pl-0 lg:pl-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col items-start text-left mb-6">
                    <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Star className="w-3.5 h-3.5" />
                      {language === "vi" ? "PHỐI HỢP HOÀN HẢO" : "PERFECT COMBINATION"}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-warm-900">
                      {language === "vi" ? "Sản Phẩm Khuyên Dùng" : "Suggested Paint Products"}
                    </h3>
                    <p className="text-[11px] text-warm-500 mt-1">
                      {language === "vi"
                        ? `Các dòng sơn cao cấp phù hợp nhất cho nhóm màu ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.name}`
                        : `Best premium paint types suggested for ${COLOR_FAMILIES.find(f => f.id === selectedFamily)?.nameEn} tones`
                      }
                    </p>
                  </div>

                  <motion.div
                    key={`paints-${selectedFamily}`}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.05 }}
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } }
                    }}
                    className="flex flex-col gap-4"
                  >
                    {paints.filter(paint => {
                      return paint.colors.some(colorCode => {
                        const colorObj = COLOR_SWATCHES.find(c => c.code === colorCode);
                        if (!colorObj) return false;
                        const targetFamily = colorObj.family;
                        return targetFamily === selectedFamily;
                      });
                    }).slice(0, 3).map((paint) => {
                      const matchingColorCode = paint.colors.find(colorCode => {
                        const colorObj = COLOR_SWATCHES.find(c => c.code === colorCode);
                        if (!colorObj) return false;
                        const targetFamily = colorObj.family;
                        return targetFamily === selectedFamily;
                      });
                      const defaultColorObj = matchingColorCode ? MOCK_COLORS.find(c => c.code === matchingColorCode) : undefined;

                      return (
                        <motion.div
                          key={paint.id}
                          variants={{
                            hidden: { opacity: 0, y: 16 },
                            visible: { opacity: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.5 } }
                          }}
                          whileHover={{ x: 4, transition: { duration: 0.2 } }}
                          className="bg-white p-3 border border-warm-150 rounded-2xl hover:shadow-md transition-all duration-300 flex gap-4 relative group text-left items-stretch"
                        >
                          {/* Paint Image Left */}
                          <Link href={`/products/${paint.slug}`} className="relative w-20 h-20 bg-warm-50/50 rounded-xl overflow-hidden border border-black/5 flex items-center justify-center p-2 shadow-inner shrink-0 cursor-pointer">
                            <Image
                              src={paint.images?.[0] || "/product_interior.png"}
                              alt={paint.name}
                              fill
                              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                            />
                            {paint.discountPercent && paint.discountPercent > 0 && (
                              <div className="absolute top-1 left-1 bg-red-500 text-white font-mono text-[8px] font-extrabold px-1 rounded shadow-xs z-10">
                                -{paint.discountPercent}%
                              </div>
                            )}
                          </Link>

                          {/* Paint Details Right */}
                          <div className="flex flex-col justify-between flex-grow">
                            <Link href={`/products/${paint.slug}`} className="flex flex-col gap-0.5 cursor-pointer">
                              <span className="text-[8px] font-bold uppercase text-warm-400 tracking-wider font-mono">
                                {MOCK_SUPPLIERS.find(s => s.id === paint.supplierId)?.name || "Jotun"}
                              </span>
                              <h4 className="font-serif font-bold text-xs text-warm-900 group-hover:text-[#88734C] transition-colors line-clamp-1">
                                {language === "vi" ? paint.name : paint.nameEn}
                              </h4>
                              <p className="text-[9px] text-warm-500 line-clamp-1 leading-normal">
                                {language === "vi" ? paint.description : paint.descriptionEn}
                              </p>
                            </Link>

                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/[0.03]">
                              {paint.discountPercent && paint.discountPercent > 0 ? (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xs font-mono font-bold text-red-500">
                                    {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                                  </span>
                                  <span className="text-[9px] font-mono text-warm-400 line-through">
                                    {formatPrice(paint.price)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs font-extrabold text-warm-900 font-mono">
                                  {formatPrice(paint.price)}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  addItem(paint, 1, defaultColorObj);
                                  toast.success(
                                    language === "vi"
                                      ? `Đã thêm ${paint.name} (Màu: ${defaultColorObj?.name || "Mặc định"}) vào giỏ hàng`
                                      : `Added ${paint.nameEn} (${defaultColorObj?.nameEn || "Default"} color) to cart`
                                  );
                                }}
                                className="btn-island bg-warm-900 hover:bg-warm-800 text-white text-[9px] px-2.5 py-1 rounded-lg border border-warm-900 shadow-xs flex items-center gap-1.5"
                              >
                                <span>{language === "vi" ? "Mua" : "Buy"}</span>
                                <span className="btn-island-icon bg-[#88734C] w-5 h-5">
                                  <ArrowRight className="h-2.5 w-2.5 text-white" />
                                </span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. CÔNG CỤ PHỐI MÀU / INTERACTIVE COLOR VISUALIZER PROMO */}
      <section id="visualizer-section" className="py-24 bg-jotun-ivory-100 border-b border-black/5 relative overflow-hidden text-left">
        {/* Subtle Dotted Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 relative z-10"
        >
          {/* Main Visualizer Header & Layout matching Image 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-20">
            {/* Left Column: Title & Intro */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {language === "vi" ? "CÔNG CỤ KỸ THUẬT SỐ" : "DIGITAL PAINT UTILITY"}
              </span>
              <h2 className="font-serif font-bold text-4xl md:text-5xl text-warm-900 leading-tight">
                {language === "vi" ? "Công Cụ Phối Màu" : "Color Visualizer"}
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                {language === "vi"
                  ? "Bạn gặp khó khăn khi chọn màu sắc hoàn hảo cho ngôi nhà của mình? Với công cụ Phối Màu trực quan từ Maison de FLOF, việc tìm kiếm màu sắc hoàn hảo chỉ đơn giản bằng một cú chạm. Hãy hiện thực hóa ngôi nhà mơ ước của bạn ngay lập tức."
                  : "Struggling to choose the perfect color scheme for your home? With Maison de FLOF's intuitive Color Visualizer, finding the ideal palette is just a tap away. Bring your dream spaces to life instantly."}
              </p>

              <div className="mt-4 p-6 bg-white/70 border border-warm-200/60 rounded-2xl flex flex-col gap-4">
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
                  <span>{language === "vi" ? "HÃY THỬ NGAY" : "TRY IT NOW"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Column: Visual of mobile mockup matching Image 2 */}
            <div className="lg:col-span-7 relative flex justify-center items-center">
              <div className="relative w-full max-w-[600px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-black/5 bg-white">
                <Image
                  src="/visualizer_mockup.png"
                  alt="Modern Visualizer Design with Dual Colors"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-103"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Features Grid Layout matching Image 3 details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-warm-250 pt-16">
            {/* Feature 1: Explore Jotun Colors */}
            <div className="bg-white/60 border border-warm-200/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
              <div className="relative w-40 h-40 shrink-0 rounded-xl overflow-hidden shadow-md bg-warm-100">
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

            {/* Feature 2: Test colors before/after */}
            <div className="bg-white/60 border border-warm-200/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
              <div className="relative w-40 h-40 shrink-0 rounded-xl overflow-hidden shadow-md bg-warm-100">
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

      {/* 4. SẢN PHẨM NỔI BẬT */}
      <section className="py-28 bg-white">
        <div className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6"
          >
            <div className="max-w-xl text-left">
              <h2 className="text-3xl font-serif font-bold text-warm-900 mb-2">
                {language === "vi" ? "Sản Phẩm Sơn Nước Nổi Bật" : "Featured Paint Products"}
              </h2>
              <p className="text-warm-500 text-xs">
                {language === "vi"
                  ? "Danh sách các dòng sơn chính hãng chất lượng cao bán chạy nhất hiện nay."
                  : "Top-selling premium authentic paint lines of the highest quality available today."}
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-warm-100 p-1 rounded-full border border-black/5">
              {[
                { value: "bestseller", label: language === "vi" ? "Bán chạy nhất" : "Bestsellers" },
                { value: "new", label: language === "vi" ? "Mới nhất" : "New" },
                { value: "promo", label: language === "vi" ? "Khuyến mãi" : "Promotions" }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                    activeTab === tab.value ? "bg-white text-warm-900 shadow-sm" : "text-warm-500 hover:text-warm-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            key={activeTab}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {FEATURED_PRODUCTS.filter(p => p.tag === activeTab || activeTab === "bestseller").map((prod) => {
              const paint = paints.find((p) => p.id === prod.id) || paints[0] || MOCK_PAINTS[0];
              const slug = paint.slug;
              return (
                <motion.div
                  key={prod.id}
                  variants={{
                    hidden: { opacity: 0, y: 32 },
                    visible: { opacity: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.7 } }
                  }}
                  className="bg-white p-5 flex flex-col gap-4 rounded-xl border border-black/5 hover:shadow-lg transition-all duration-500 h-full group relative"
                >
                  <Link href={`/products/${slug}`} className="flex flex-col gap-4 flex-grow cursor-pointer">
                    <div className="relative h-80 w-full bg-jotun-ivory-100 rounded-xl overflow-hidden border border-black/5 flex items-center justify-center p-6 shadow-inner">
                      <Image
                        src={paint.images?.[0] || "/product_interior.png"}
                        alt={language === "vi" ? prod.name : (prod.nameEn || prod.name)}
                        fill
                        className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                      />
                      {paint.discountPercent && paint.discountPercent > 0 && (
                        <div className="absolute top-3.5 left-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-lg shadow-md z-10 animate-pulse select-none border border-white/20">
                          -{paint.discountPercent}%
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-grow text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-warm-400 font-mono">
                          {MOCK_SUPPLIERS.find(s => s.id === paint.supplierId)?.name || "Jotun"}
                        </span>
                        <div className="flex gap-0.5 text-jotun-teal">
                          {Array.from({ length: prod.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>

                      <h3 className="font-serif font-bold text-base group-hover:text-jotun-teal transition-colors text-warm-900 line-clamp-1">
                        {language === "vi" ? prod.name : (prod.nameEn || prod.name)}
                      </h3>

                      <p className="text-xs text-warm-500 line-clamp-2 leading-relaxed">
                        {language === "vi" ? prod.desc : (prod.descEn || prod.desc)}
                      </p>
                    </div>
                  </Link>

                  <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between">
                    {paint.discountPercent && paint.discountPercent > 0 ? (
                      <div className="flex flex-col items-start">
                        <span className="text-base font-mono font-bold text-red-500">
                          {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                        </span>
                        <span className="text-xs font-mono text-warm-400 line-through">
                          {formatPrice(paint.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-extrabold text-warm-900 font-mono">
                        {formatPrice(paint.price)}
                      </span>
                    )}
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="btn-island bg-jotun-teal hover:bg-jotun-teal-dark text-white text-xs px-4 py-2"
                    >
                      <span>{language === "vi" ? "Mua ngay" : "Buy now"}</span>
                      <span className="btn-island-icon bg-white/20">
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 5. TƯ VẤN & XU HƯỚNG TỪ CHUYÊN GIA / EXPERT BLOGS & GUIDES */}
      <section id="blogs-section" className="py-28 bg-jotun-ivory-100 border-b border-black/5">
        <div className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-16"
          >
            <span className="text-[#88734C] font-semibold text-xs tracking-widest mb-3 flex items-center justify-center gap-2 uppercase">
              <Sparkles className="w-4 h-4 text-[#88734C]" />
              {language === "vi" ? "CẨM NANG & CẢM HỨNG" : "GUIDES & INSPIRATION"}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-warm-900 mb-4 leading-tight">
              {language === "vi" ? "Tư Vấn & Xu Hướng Từ Chuyên Gia" : "Expert Advice & Design Trends"}
            </h2>
            <div className="w-16 h-1 bg-[#88734C] mx-auto mt-2 mb-6" />
            <p className="text-warm-550 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
              {language === "vi"
                ? "Cập nhật các xu hướng màu sắc mới nhất và những hướng dẫn thi công thực tế từ đội ngũ chuyên gia của chúng tôi."
                : "Stay updated with the latest color trends and practical application guides from our expert team."}
            </p>
          </motion.div>

          <div className="flex flex-col gap-10 max-w-[1200px] mx-auto">
            {MOCK_BLOGS.map((blog, idx) => {
              const title = language === "vi" ? blog.title : (blog.titleEn || blog.title);
              const summary = language === "vi" ? blog.summary : (blog.summaryEn || blog.summary);
              const category = language === "vi" ? blog.category : (blog.categoryEn || blog.category);

              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: idx * 0.15 }}
                  className="group bg-white rounded-3xl overflow-hidden border border-black/5 hover:border-[#88734C]/30 shadow-sm hover:shadow-xl transition-all duration-500 grid grid-cols-1 md:grid-cols-12 items-stretch"
                >
                  {/* Blog Image */}
                  <div className="md:col-span-5 relative min-h-[260px] md:min-h-full overflow-hidden">
                    <Image
                      src={blog.image}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />

                    {/* Category Tag overlay on image */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#88734C] border border-[#88734C]/10 text-[9px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full shadow-xs">
                      {category}
                    </div>
                  </div>

                  {/* Blog Content */}
                  <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between items-start text-left bg-gradient-to-br from-white to-warm-50/10">
                    <div className="flex flex-col gap-4 w-full">
                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-[10px] text-warm-450 font-bold uppercase tracking-wider">
                        <span>{blog.author.split(" - ")[0]}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-warm-300" />
                        <span>{blog.readTime}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-warm-300 hidden sm:inline" />
                        <span className="hidden sm:inline">{blog.createdAt}</span>
                      </div>

                      <h3 className="font-serif font-bold text-xl md:text-2xl text-warm-900 group-hover:text-jotun-teal transition-colors duration-300 leading-tight">
                        {title}
                      </h3>

                      <p className="text-xs md:text-sm text-warm-550 leading-relaxed font-light line-clamp-3">
                        {summary}
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-black/5 w-full flex items-center justify-between">
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-warm-900 group-hover:text-jotun-teal transition-all duration-300"
                      >
                        <span>{language === "vi" ? "Đọc bài viết" : "Read Article"}</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CÔNG TRÌNH THỰC TẾ (Before/After & Gallery) */}
      <section className="py-28 bg-white">
        <div className="w-full max-w-[1880px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-serif font-bold text-warm-900 mb-2">
              {language === "vi" ? "Các Dự Án Đã Hoàn Thiện" : "Completed Projects"}
            </h2>
            <p className="text-warm-500 text-xs">
              {language === "vi"
                ? "Hình ảnh thực tế thi công. Rê/Kéo thanh trượt để so sánh ảnh trước và sau khi hoàn thiện sơn."
                : "Real construction images. Drag the slider to compare before and after the paint finish."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
          >
            {/* Before After Slider (Left) */}
            <div className="lg:col-span-7">
              <div
                ref={sliderRef}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative h-[480px] md:h-[600px] w-full rounded-2xl overflow-hidden cursor-ew-resize bg-zinc-900 select-none shadow-xl border border-black/5"
              >
                <Image
                  src="/living_sage.png"
                  alt={language === "vi" ? "Sau khi sơn" : "After painting"}
                  fill
                  className="object-cover pointer-events-none"
                />

                <div
                  className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <div className="absolute inset-y-0 left-0 h-full" style={{ width: `${sliderWidth}px` }}>
                    <Image
                      src="/living_before.png"
                      alt={language === "vi" ? "Trước khi sơn" : "Before painting"}
                      fill
                      className="object-cover pointer-events-none"
                    />
                  </div>
                </div>

                <div
                  className="absolute inset-y-0 w-1 bg-white flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-warm-900 shadow-md flex items-center justify-center text-warm-900 text-xs font-bold font-mono">
                    ↔
                  </div>
                </div>

                <span className="absolute bottom-3 left-3 bg-zinc-950/70 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  {language === "vi" ? "Trước" : "Before"}
                </span>
                <span className="absolute bottom-3 right-3 bg-jotun-teal/80 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  {language === "vi" ? "Sau khi sơn" : "After"}
                </span>
              </div>
            </div>

            {/* Gallery (Right) */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              <h3 className="font-serif font-bold text-2xl text-warm-900">
                {language === "vi" ? "Kiến tạo mảng màu sang trọng" : "Crafting Luxurious Color Palettes"}
              </h3>
              <p className="text-xs text-warm-500 leading-relaxed">
                {language === "vi"
                  ? "Maison de FLOF vinh hạnh đồng hành cùng hàng nghìn nhà thầu uy tín kiến tạo nên vẻ đẹp sang trọng, đẳng cấp và trường tồn cho các công trình trọng điểm tại Việt Nam."
                  : "Maison de FLOF is honored to partner with thousands of reputable contractors, creating timeless luxury and prestige for key projects across Vietnam."}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "/living_beige.png",
                  "/living_terracotta.png"
                ].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="relative h-36 md:h-48 overflow-hidden rounded-xl group cursor-pointer border border-black/5 shadow-sm"
                  >
                    <Image
                      src={src}
                      alt={language === "vi" ? "Công trình thực tế" : "Completed project"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>



}

    </div>
  );
}
