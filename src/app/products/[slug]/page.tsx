"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { MOCK_PAINTS, MOCK_COLORS, MOCK_CATEGORIES, MOCK_SUPPLIERS, Paint, PaintColor } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  findClosestColor
} from "@/lib/color-utils";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Shield,
  Truck,
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const { addItem } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [paints, setPaints] = useState<Paint[]>(MOCK_PAINTS);
  const [paint, setPaint] = useState<Paint | null>(null);
  const [selectedColor, setSelectedColor] = useState<PaintColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "features" | "application" | "specs">("description");

  useEffect(() => {
    setMounted(true);
    
    let localPaints = MOCK_PAINTS;
    const storedPaints = localStorage.getItem("sonvn-paints");
    if (storedPaints) {
      try {
        localPaints = JSON.parse(storedPaints);
        setPaints(localPaints);
      } catch (e) {}
    } else {
      localStorage.setItem("sonvn-paints", JSON.stringify(MOCK_PAINTS));
    }

    const slug = params?.slug as string;
    if (slug) {
      const match = localPaints.find((p) => p.slug === slug);
      if (match) {
        setPaint(match);
        // Pre-select first color if available
        if (match.colors && match.colors.length > 0) {
          const firstColorMatch = MOCK_COLORS.find((c) => c.code === match.colors[0]);
          if (firstColorMatch) {
            setSelectedColor(firstColorMatch);
          }
        }
      }
    }
  }, [params]);

  if (!mounted) return null;

  if (!paint) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-bold font-serif mb-4">
          {language === "vi" ? "Sản phẩm không tồn tại" : "Product Not Found"}
        </h2>
        <Link href="/products" className="text-jotun-teal hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === "vi" ? "Quay lại danh sách sản phẩm" : "Back to products"}
        </Link>
      </div>
    );
  }

  const category = MOCK_CATEGORIES.find((c) => c.id === paint.categoryId);
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === paint.supplierId);

  // Find detailed color objects
  const availableColors = MOCK_COLORS.filter((c) => paint.colors.includes(c.code));

  // Coordinating Palettes
  let complementaryColorMatches: PaintColor[] = [];
  let analogousColorMatches: PaintColor[] = [];
  let triadicColorMatches: PaintColor[] = [];

  if (selectedColor) {
    // Complementary
    const compHexes = getComplementaryColors(selectedColor.hex);
    compHexes.forEach((hex) => {
      const match = findClosestColor(hex, MOCK_COLORS);
      if (match) complementaryColorMatches.push(match);
    });

    // Analogous
    const analHexes = getAnalogousColors(selectedColor.hex);
    analHexes.forEach((hex) => {
      const match = findClosestColor(hex, MOCK_COLORS);
      if (match && !analogousColorMatches.some((m) => m.code === match.code)) {
        analogousColorMatches.push(match);
      }
    });

    // Triadic
    const triHexes = getTriadicColors(selectedColor.hex);
    triHexes.forEach((hex) => {
      const match = findClosestColor(hex, MOCK_COLORS);
      if (match && !triadicColorMatches.some((m) => m.code === match.code)) {
        triadicColorMatches.push(match);
      }
    });
  }

  const handleAddToCart = () => {
    if (paint.colors.length > 0 && !selectedColor) {
      toast.error(
        language === "vi"
          ? "Vui lòng chọn một mã màu sơn."
          : "Please select a paint color code."
      );
      return;
    }
    addItem(paint, quantity, selectedColor || undefined);
    toast.success(
      language === "vi"
        ? `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`
        : `Added ${quantity} items to cart.`
    );
  };

  const handleBuyNow = () => {
    if (paint.colors.length > 0 && !selectedColor) {
      toast.error(
        language === "vi"
          ? "Vui lòng chọn một mã màu sơn."
          : "Please select a paint color code."
      );
      return;
    }
    addItem(paint, quantity, selectedColor || undefined);
    router.push("/cart");
  };

  const relatedPaints = paints.filter(
    (p) => p.id !== paint.id && (p.categoryId === paint.categoryId || p.supplierId === paint.supplierId)
  ).slice(0, 3);

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Back button */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-jotun-teal mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        {language === "vi" ? "Quay lại danh sách sản phẩm" : "Back to products"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        {/* Gallery Column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative h-[450px] w-full rounded-xl overflow-hidden border border-border bg-zinc-50 shadow-sm">
            <Image
              src={paint.images?.[0] || "/product_interior.png"}
              alt={paint.name}
              fill
              priority
              className="object-cover"
            />
            {selectedColor && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border border-border p-3 rounded-lg flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-md border border-black/10 shrink-0"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {language === "vi" ? "Màu đã chọn" : "Selected Color"}
                  </p>
                  <p className="text-sm font-bold">
                    {language === "vi" ? selectedColor.name : selectedColor.nameEn} ({selectedColor.code})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchase details Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-jotun-teal/10 text-jotun-teal text-xs font-bold rounded">
                {supplier?.name}
              </span>
              <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-muted-foreground text-xs font-bold rounded">
                {language === "vi" ? category?.name : category?.nameEn}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif leading-tight">
              {language === "vi" ? paint.name : paint.nameEn}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">SKU: {paint.sku}</p>
          </div>

          {/* Pricing */}
          <div className="border-y border-border py-4 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground block">
                {language === "vi" ? "Đơn giá lẻ" : "Retail Price"}
              </span>
              {paint.discountPercent && paint.discountPercent > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-500 font-mono animate-fade-in">
                    {formatPrice(paint.price * (1 - paint.discountPercent / 100))}
                  </span>
                  <span className="text-sm text-muted-foreground line-through font-mono">
                    {formatPrice(paint.price)}
                  </span>
                  <span className="text-xs font-extrabold text-white bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1 rounded-lg shadow-md animate-pulse border border-white/20 select-none">
                    -{paint.discountPercent}%
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-jotun-teal font-mono">
                  {formatPrice(paint.price)}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground block">{t.productVolume}</span>
              <span className="px-3 py-1 bg-jotun-yellow/15 text-jotun-yellow font-bold rounded text-sm inline-block font-mono">
                {paint.volume} {paint.volumeUnit}
              </span>
            </div>
          </div>

          {/* Color swatches selector */}
          {availableColors.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-sm">
                {language === "vi" ? "Chọn màu sơn:" : "Select Paint Color:"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.code}
                    onClick={() => setSelectedColor(color)}
                    title={`${color.name} (${color.code})`}
                    className={`h-11 w-11 rounded-md border flex items-center justify-center relative transition-all duration-200 ${
                      selectedColor?.code === color.code
                        ? "border-zinc-900 dark:border-white ring-2 ring-jotun-teal scale-105"
                        : "border-black/10 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selectedColor?.code === color.code && (
                      <span className="h-5 w-5 bg-white dark:bg-zinc-900 border border-border rounded-full flex items-center justify-center shadow">
                        <Check className="h-3 w-3 text-jotun-teal stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Dynamic Coordinate Palettes */}
              {selectedColor && (
                <div className="mt-2 bg-jotun-lightGray dark:bg-zinc-900/40 border border-border rounded-lg p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-jotun-teal uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>{language === "vi" ? "Phối màu gợi ý" : "Coordinating Palettes"}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Complementary */}
                    {complementaryColorMatches.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">
                          {t.complementaryColors}
                        </span>
                        <div className="flex items-center gap-2">
                          {complementaryColorMatches.map((col) => (
                            <button
                              key={col.code}
                              onClick={() => setSelectedColor(col)}
                              className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-950 border border-border rounded-md hover:border-jotun-teal transition-all text-left w-full group"
                            >
                              <div
                                className="h-6 w-6 rounded border border-black/10 shrink-0"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span className="text-[10px] font-bold line-clamp-1 group-hover:text-jotun-teal">
                                {language === "vi" ? col.name : col.nameEn}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analogous */}
                    {analogousColorMatches.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">
                          {t.analogousColors}
                        </span>
                        <div className="flex flex-col gap-1">
                          {analogousColorMatches.map((col) => (
                            <button
                              key={col.code}
                              onClick={() => setSelectedColor(col)}
                              className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-950 border border-border rounded-md hover:border-jotun-teal transition-all text-left w-full group"
                            >
                              <div
                                className="h-6 w-6 rounded border border-black/10 shrink-0"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span className="text-[10px] font-bold line-clamp-1 group-hover:text-jotun-teal">
                                {language === "vi" ? col.name : col.nameEn}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Triadic */}
                    {triadicColorMatches.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">
                          {t.triadicColors}
                        </span>
                        <div className="flex flex-col gap-1">
                          {triadicColorMatches.map((col) => (
                            <button
                              key={col.code}
                              onClick={() => setSelectedColor(col)}
                              className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-950 border border-border rounded-md hover:border-jotun-teal transition-all text-left w-full group"
                            >
                              <div
                                className="h-6 w-6 rounded border border-black/10 shrink-0"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span className="text-[10px] font-bold line-clamp-1 group-hover:text-jotun-teal">
                                {language === "vi" ? col.name : col.nameEn}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity selector & Add buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-6">
            <div className="flex items-center border border-border rounded-md w-full sm:w-auto bg-white dark:bg-zinc-950">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-center font-bold font-mono min-w-10">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold px-8 py-3.5 rounded-md transition-colors flex items-center justify-center gap-2 border border-border shadow-sm"
            >
              <ShoppingCart className="h-5 w-5" />
              {t.addToCart}
            </button>
            <button
              onClick={handleBuyNow}
              className="w-full sm:w-auto bg-warm-900 text-white font-bold px-8 py-3.5 rounded-md hover:bg-warm-800 transition-colors shadow-md text-center"
            >
              {t.buyNow}
            </button>
          </div>

          {/* Quick value trust badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-jotun-teal/10 text-jotun-teal rounded-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">{language === "vi" ? "Chính hãng 100%" : "100% Genuine"}</p>
                <p className="text-[10px] text-muted-foreground">{language === "vi" ? "Bảo hành nhà máy" : "Factory warranty"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-jotun-yellow/10 text-jotun-yellow rounded-md">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">{language === "vi" ? "Giao hàng nhanh" : "Fast Delivery"}</p>
                <p className="text-[10px] text-muted-foreground">{language === "vi" ? "Nội thành 24h" : "Within 24h local"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-jotun-teal/10 text-jotun-teal rounded-md">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">{language === "vi" ? "Đổi trả dễ dàng" : "Easy Return"}</p>
                <p className="text-[10px] text-muted-foreground">{language === "vi" ? "Trong vòng 7 ngày" : "Within 7 days"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs description section */}
      <section className="mb-20">
        <div className="flex border-b border-border mb-8 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("description")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "description"
                ? "border-jotun-teal text-jotun-teal"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info className="h-4 w-4" />
            {t.tabDescription}
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "features"
                ? "border-jotun-teal text-jotun-teal"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {t.tabFeatures}
          </button>
          <button
            onClick={() => setActiveTab("application")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "application"
                ? "border-jotun-teal text-jotun-teal"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Check className="h-4 w-4" />
            {t.tabApplication}
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "specs"
                ? "border-jotun-teal text-jotun-teal"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info className="h-4 w-4" />
            {t.tabSpecs}
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-border p-8 rounded-xl shadow-sm leading-relaxed text-sm">
          {activeTab === "description" && (
            <div className="flex flex-col gap-4">
              <p>{language === "vi" ? paint.description : paint.descriptionEn}</p>
            </div>
          )}

          {activeTab === "features" && (
            <div className="flex flex-col gap-4">
              <ul className="list-disc pl-5 flex flex-col gap-2">
                {(language === "vi" ? paint.features : paint.featuresEn)?.split(", ").map((feat, index) => (
                  <li key={index} className="font-semibold text-foreground">{feat}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "application" && (
            <div className="flex flex-col gap-4">
              <p>{paint.application || (language === "vi" ? "Thông tin đang cập nhật" : "TBD")}</p>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="flex flex-col gap-6">
              <p className="mb-2">{paint.specifications || (language === "vi" ? "Thông tin đang cập nhật" : "TBD")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-muted-foreground font-semibold">{t.productCoverage}</span>
                  <span className="font-bold">{paint.coverage} m²/lít/lớp</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-muted-foreground font-semibold">{t.productCoats}</span>
                  <span className="font-bold">{paint.coatsRequired} lớp</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-muted-foreground font-semibold">{t.productFinish}</span>
                  <span className="font-bold">{paint.finish}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-muted-foreground font-semibold">{t.productDrying}</span>
                  <span className="font-bold">{paint.dryingTime || "30-60 phút"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related paints grid */}
      {relatedPaints.length > 0 && (
        <section className="border-t border-border pt-16">
          <h2 className="text-2xl font-bold font-serif mb-8">
            {t.relatedProducts}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPaints.map((item) => {
              const itemSupplier = MOCK_SUPPLIERS.find((s) => s.id === item.supplierId);
              return (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="bg-white dark:bg-zinc-950 rounded-lg border border-border p-4 flex flex-col gap-4 group cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 w-full bg-zinc-100 rounded-md overflow-hidden">
                    <Image
                      src={item.images?.[0] || "/product_interior.png"}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider font-mono">
                        {itemSupplier?.name}
                      </span>
                      <span className="px-2 py-0.5 bg-jotun-yellow/15 text-jotun-yellow text-[9px] font-bold rounded">
                        {item.volume} {item.volumeUnit}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base leading-snug line-clamp-2 text-foreground group-hover:text-jotun-teal transition-colors">
                      {language === "vi" ? item.name : item.nameEn}
                    </h3>
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</span>
                      <span className="text-sm font-bold text-jotun-teal font-mono">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
