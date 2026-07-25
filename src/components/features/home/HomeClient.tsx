"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "@/components/ui/csp-toast";
import { Paint, PaintColor } from "@/types";
import { useSession } from "next-auth/react";
import { safeMotion } from "@/components/ui/motion-safe";
import {
  canAddCatalogItemToCart,
  type CatalogAvailability,
} from "@/lib/catalog-result";

import { HeroSection } from "./HeroSection";
import { PromotionSection } from "./PromotionSection";
import { ColorExplorerSection } from "./ColorExplorerSection";
import { VisualizerPromoSection } from "./VisualizerPromoSection";
import { StoreOverviewSection } from "./StoreOverviewSection";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { ExpertBlogsSection } from "./ExpertBlogsSection";

interface HomeClientProps {
  initialPaints: any[];
  initialColors: any[];
  initialBlogs: any[];
  catalogAvailability: CatalogAvailability;
}

export function HomeClient({
  initialPaints,
  initialColors,
  initialBlogs,
  catalogAvailability,
}: HomeClientProps) {
  const { language } = useLanguageStore();
  const addItem = useCartStore((state) => state.addItem);
  const { status: authStatus } = useSession();

  // States
  const [activeTab, setActiveTab] = useState<"bestseller" | "new" | "promo">("bestseller");
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const goOnline = () => setIsOffline(false);
      const goOffline = () => setIsOffline(true);
      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }
  }, []);

  // Color family picker state
  const [selectedFamily, setSelectedFamily] = useState<string>("white");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [visWallMainColor, setVisWallMainColor] = useState("#D6E3DB"); // Imagine

  const [paints, setPaints] = useState<(Paint & { supplier?: { name: string }; soldCount?: number })[]>(initialPaints);
  const [colorCatalog, setColorCatalog] = useState<PaintColor[]>(initialColors);
  const [blogs, setBlogs] = useState<any[]>(initialBlogs);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetch("/api/profile/favorites")
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) setWishlist(data);
        })
        .catch((error) => console.error("Không thể tải danh sách yêu thích:", error));
      return;
    }

    if (authStatus === "unauthenticated") {
      const saved = localStorage.getItem("sonvn-color-wishlist");
      if (!saved) return;
      try {
        setWishlist(JSON.parse(saved));
      } catch {
        localStorage.removeItem("sonvn-color-wishlist");
      }
    }
  }, [authStatus]);

  const toggleWishlist = async (code: string) => {
    const previous = wishlist;
    let newWish: string[];
    if (previous.includes(code)) {
      newWish = previous.filter(c => c !== code);
      toast.info(language === "vi" ? "Đã xóa màu khỏi mục yêu thích" : "Removed color from favorites");
    } else {
      newWish = [...previous, code];
      toast.success(language === "vi" ? "Đã thêm màu vào mục yêu thích" : "Added color to favorites");
    }
    setWishlist(newWish);

    if (authStatus !== "authenticated") {
      localStorage.setItem("sonvn-color-wishlist", JSON.stringify(newWish));
      return;
    }

    try {
      const response = await fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error("Không thể cập nhật danh sách yêu thích");
    } catch (error) {
      setWishlist(previous);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật danh sách yêu thích");
    }
  };

  const handleAddToCart = (prod: any) => {
    if (!canAddCatalogItemToCart(catalogAvailability)) {
      toast.error(
        language === "vi"
          ? "Chức năng mua hàng đang tạm khóa"
          : "Purchasing is temporarily disabled",
      );
      return;
    }

    const paint = paints.find((p) => p.id === prod.id);
    if (!paint) {
      toast.error("Không tìm thấy sản phẩm / Product not found");
      return;
    }

    const defaultColor = colorCatalog.find((c) => c.code === "0001") || colorCatalog[0] || {
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

  if (isOffline) {
    return (
      <div className="relative w-full bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 text-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
        <safeMotion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="relative max-w-md w-full bg-white border border-warm-300 rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col items-center gap-6 z-10"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl animate-pulse">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-warm-900 leading-tight">
              {language === "vi" ? "Mất kết nối Internet" : "No Internet Connection"}
            </h2>
            <p className="text-xs sm:text-sm text-warm-550 leading-relaxed font-light">
              {language === "vi"
                ? "Không thể kết nối đến máy chủ Maison de FLOF. Vui lòng kiểm tra kết nối Wifi/4G của bạn và thử lại."
                : "Unable to connect to Maison de FLOF servers. Please check your Wifi or mobile data and try again."}
            </p>
          </div>
          <button
            onClick={() => {
              setIsTabLoading(true);
              setIsOffline(!navigator.onLine);
              setTimeout(() => {
                setIsTabLoading(false);
              }, 600);
            }}
            className="w-full py-3 bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-98"
          >
            {language === "vi" ? "Thử lại kết nối" : "Retry Connection"}
          </button>
        </safeMotion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-jotun-ivory text-warm-900 transition-colors duration-300">
      {!catalogAvailability.commerceAvailable && (
        <div
          role="status"
          className="mx-auto mt-24 w-[calc(100%-2rem)] max-w-[1360px] rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {language === "vi"
            ? "Dữ liệu sản phẩm trực tiếp đang tạm gián đoạn. Bạn vẫn có thể tham khảo danh mục, nhưng chức năng mua hàng đang tạm khóa."
            : "Live product data is temporarily unavailable. You can still browse the catalog, but purchasing is disabled."}
        </div>
      )}
      <HeroSection />
      <PromotionSection />
      <ColorExplorerSection
        selectedFamily={selectedFamily}
        setSelectedFamily={setSelectedFamily}
        visWallMainColor={visWallMainColor}
        setVisWallMainColor={setVisWallMainColor}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        paints={paints}
        colorCatalog={colorCatalog}
        addItem={addItem}
        commerceAvailable={catalogAvailability.commerceAvailable}
      />
      <VisualizerPromoSection />
      <StoreOverviewSection />
      <FeaturedProductsSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTabLoading={isTabLoading}
        setIsTabLoading={setIsTabLoading}
        paints={paints}
        colorCatalog={colorCatalog}
        handleAddToCart={handleAddToCart}
        commerceAvailable={catalogAvailability.commerceAvailable}
      />
      <ExpertBlogsSection blogs={blogs} />
    </div>
  );
}

