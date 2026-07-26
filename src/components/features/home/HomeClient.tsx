/* Hallmark · genre: editorial · macrostructure: 08 Photographic · H6 hero knobs: image=full-bleed, caption=lower-left, text=left-bias
 * drench order: sage (visualizer) → clay (advice strip) → espresso (journal) — no two adjacent bands share a colour
 * design-system: design.md · designed-as-app */ "use client";

import Link from "next/link";
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
import { initFlReveal } from "@/lib/fl-reveal";
import { initFlSlice } from "@/lib/fl-slice";

import { BandEdge, DrenchBand, SwatchMarquee } from "@/components/ui/editorial";
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

  useEffect(() => {
    const disposeReveal = initFlReveal();
    const disposeSlice = initFlSlice();
    return () => {
      disposeReveal();
      disposeSlice();
    };
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
    // Intentional editorial empty state: a rule, a line of Playfair, one action.
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center bg-atelier-paper px-fl-md py-fl-2xl">
        <safeMotion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-md flex-col items-start gap-fl-sm border-t border-atelier-rule-strong pt-fl-md text-left"
        >
          <p className="fl-label">
            {language === "vi" ? "Mất kết nối" : "Offline"}
          </p>
          <h2 className="fl-display text-fl-2xl text-atelier-ink">
            {language === "vi" ? "Mất kết nối Internet" : "No internet connection"}
          </h2>
          <p className="text-fl-sm text-atelier-ink-2">
            {language === "vi"
              ? "Không thể kết nối đến máy chủ Maison de FLOF. Vui lòng kiểm tra kết nối Wifi/4G của bạn và thử lại."
              : "Unable to connect to Maison de FLOF servers. Please check your Wifi or mobile data and try again."}
          </p>
          <button
            onClick={() => {
              setIsTabLoading(true);
              setIsOffline(!navigator.onLine);
              setTimeout(() => {
                setIsTabLoading(false);
              }, 600);
            }}
            className="mt-fl-xs inline-flex min-h-11 items-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-accent-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-accent-hover md:min-h-10"
          >
            {language === "vi" ? "Thử lại kết nối" : "Retry connection"}
          </button>
        </safeMotion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-atelier-paper text-atelier-ink">
      {!catalogAvailability.commerceAvailable && (
        <div
          role="status"
          className="mx-auto w-full max-w-[100rem] border-l-2 border-atelier-danger px-[clamp(1rem,4vw,1.5rem)] py-fl-sm text-fl-sm text-atelier-ink"
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
      {/* Advice strip — one sentence, one action, painted. Clay rather than
          ochre: ochre was the only band needing dark ink, which made its button
          read as a heavy slab and put a mustard note against the warm mineral
          palette. Clay sits in the same warm family as the paper. The band
          arrives as a painted wave (BandEdge) — the page's single Tier-B
          enrichment. */}
      {/* Colour index drift — real shades only, the page's one marquee. */}
      <SwatchMarquee
        className="bg-atelier-paper-2"
        items={colorCatalog.slice(0, 14).map((color) => ({
          code: color.code,
          name: language === "vi" ? color.name : color.nameEn || color.name,
          hex: color.hex,
        }))}
      />
      <div className="fl-rise">
      <BandEdge color="clay" className="bg-atelier-paper-2" />
      <DrenchBand color="clay" className="py-fl-2xl md:py-fl-3xl">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-fl-sm px-[clamp(1rem,4vw,1.5rem)] md:flex-row md:items-end md:justify-between">
          <p className="fl-display max-w-2xl text-fl-2xl">
            {language === "vi"
              ? "Công trình lớn cần một bảng màu được tính toán. Đội ngũ FLOF phản hồi trong 24 giờ."
              : "A larger project deserves a considered palette. The FLOF team replies within 24 hours."}
          </p>
          <Link
            href="/quote-request"
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-control bg-atelier-on-dark px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-espresso transition-opacity duration-fl-fast ease-fl-out hover:opacity-90 md:min-h-10"
          >
            {language === "vi" ? "Đặt lịch tư vấn" : "Book a consultation"}
          </Link>
        </div>
      </DrenchBand>
      </div>
      <ExpertBlogsSection blogs={blogs} />
    </div>
  );
}

