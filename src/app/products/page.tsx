"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { MOCK_PAINTS, MOCK_CATEGORIES, MOCK_SUPPLIERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  // States
  const [paints, setPaints] = useState<any[]>(MOCK_PAINTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedFinish, setSelectedFinish] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const storedPaints = localStorage.getItem("sonvn-paints");
    if (storedPaints) {
      try {
        setPaints(JSON.parse(storedPaints));
      } catch (e) {}
    }

    // Load dynamic products from DB API
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPaints(data);
          localStorage.setItem("sonvn-paints", JSON.stringify(data));
        }
      })
      .catch((err) => console.error("Error loading products from DB API:", err));

    // Parse URL params if any (e.g. from homepage category click)
    const catParam = searchParams.get("category");
    if (catParam) {
      const match = MOCK_CATEGORIES.find((c) => c.slug === catParam);
      if (match) setSelectedCategory(match.id);
    }
  }, [searchParams]);

  // Filter logic
  const filteredProducts = paints.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "promo" && p.discountPercent !== undefined && p.discountPercent > 0) ||
      p.categoryId === selectedCategory;

    const matchesSupplier = selectedSupplier === "all" || p.supplierId === selectedSupplier;
    const matchesFinish = selectedFinish === "all" || p.finish === selectedFinish;

    return matchesSearch && matchesCategory && matchesSupplier && matchesFinish;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "priceAsc") return a.price - b.price;
    if (sortBy === "priceDesc") return b.price - a.price;
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    return 0; // default (no sort)
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300 pt-32 pb-24">
      {/* Editorial Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="py-12 relative overflow-hidden bg-jotun-ivory"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="container mx-auto px-6 max-w-7xl text-left relative z-10">
          
          <h1 className="text-4xl md:text-6xl font-serif font-extrabold tracking-tight text-warm-900 mb-4 uppercase leading-none">
            {language === "vi" ? "Sản Phẩm Sơn Nước" : "Paint Products"}
          </h1>
          <p className="text-warm-500 text-sm md:text-base max-w-2xl font-light leading-relaxed">
            {language === "vi"
               ? "Tìm kiếm giải pháp bảo vệ tối ưu và mang lại vẻ đẹp bền lâu cho công trình của bạn."
               : "Search the ultimate protection solution and bring long-lasting beauty to your project."}
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            className="lg:col-span-3 bg-white border border-warm-200/80 rounded-2xl p-6 flex flex-col gap-6 text-left shadow-sm sticky top-24 self-start"
          >
            <div className="flex flex-col gap-6 text-left">
              <div className="flex items-center justify-between border-b border-black/5 pb-3">
                <h3 className="font-bold flex items-center gap-2 text-sm text-warm-900">
                  <SlidersHorizontal className="h-4 w-4 text-jotun-teal" />
                  {language === "vi" ? "Bộ lọc" : "Filters"}
                </h3>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedSupplier("all");
                    setSelectedFinish("all");
                    setSortBy("default");
                    router.replace("/products");
                  }}
                  className="text-xs text-jotun-teal hover:underline font-bold"
                >
                  {language === "vi" ? "Xóa bộ lọc" : "Clear all"}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                <input
                  type="text"
                  placeholder={language === "vi" ? "Tìm tên sản phẩm..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal transition-all"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                  {t.productCategory}
                </span>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3.5 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
                    >
                      <span className="truncate">
                        {selectedCategory === "all"
                          ? (language === "vi" ? "Tất cả danh mục" : "All Categories")
                          : selectedCategory === "promo"
                          ? (language === "vi" ? "Sản phẩm khuyến mãi" : "Sale Products")
                          : (language === "vi"
                            ? MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.name
                            : MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.nameEn)}
                      </span>
                      <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                      <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Tất cả danh mục" : "All Categories"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="promo" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Sản phẩm khuyến mãi" : "Sale Products"}
                      </DropdownMenuRadioItem>
                      {MOCK_CATEGORIES.map((c) => (
                        <DropdownMenuRadioItem
                          key={c.id}
                          value={c.id}
                          className="text-xs font-semibold text-warm-900 cursor-pointer"
                        >
                          {language === "vi" ? c.name : c.nameEn}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Supplier */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                  {t.productSupplier}
                </span>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3.5 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
                    >
                      <span className="truncate">
                        {selectedSupplier === "all"
                          ? (language === "vi" ? "Tất cả hãng sản xuất" : "All Brands")
                          : MOCK_SUPPLIERS.find((s) => s.id === selectedSupplier)?.name}
                      </span>
                      <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuRadioGroup value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Tất cả hãng sản xuất" : "All Brands"}
                      </DropdownMenuRadioItem>
                      {MOCK_SUPPLIERS.map((s) => (
                        <DropdownMenuRadioItem
                          key={s.id}
                          value={s.id}
                          className="text-xs font-semibold text-warm-900 cursor-pointer"
                        >
                          {s.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Finish */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                  {t.productFinish}
                </span>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3.5 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
                    >
                      <span className="truncate">
                        {selectedFinish === "all"
                          ? (language === "vi" ? "Tất cả bề mặt" : "All Finishes")
                          : selectedFinish === "MATTE"
                          ? (language === "vi" ? "Mờ / Matte" : "Matte")
                          : selectedFinish === "GLOSS"
                          ? (language === "vi" ? "Bóng / Gloss" : "Gloss")
                          : (language === "vi" ? "Bán bóng / Semi-Gloss" : "Semi-Gloss")}
                      </span>
                      <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuRadioGroup value={selectedFinish} onValueChange={setSelectedFinish}>
                      <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Tất cả bề mặt" : "All Finishes"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="MATTE" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Mờ / Matte" : "Matte"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="GLOSS" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Bóng / Gloss" : "Gloss"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="SEMI_GLOSS" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Bán bóng / Semi-Gloss" : "Semi-Gloss"}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.aside>

          {/* Product Cards List (Right) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
            className="lg:col-span-9 flex flex-col gap-6"
          >
            {/* Sorting panel */}
            <div className="bg-white/80 backdrop-blur-md p-4 border border-black/5 rounded-2xl shadow-xs flex items-center justify-between gap-4 text-left">
              <span className="text-xs font-bold text-warm-500">
                {language === "vi"
                  ? `Hiển thị ${sortedProducts.length} sản phẩm`
                  : `Showing ${sortedProducts.length} products`}
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-warm-450" />
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 h-8 bg-white border-warm-200 text-warm-900 rounded-lg text-xs font-bold focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal transition-all flex items-center justify-between gap-1"
                    >
                      <span>
                        {sortBy === "default"
                          ? (language === "vi" ? "Sắp xếp mặc định" : "Default sorting")
                          : sortBy === "priceAsc"
                          ? (language === "vi" ? "Giá: Thấp đến Cao" : "Price: Low to High")
                          : sortBy === "priceDesc"
                          ? (language === "vi" ? "Giá: Cao đến Thấp" : "Price: High to Low")
                          : (language === "vi" ? "Tên A-Z" : "Name A-Z")}
                      </span>
                      <ChevronDown className="-me-1 ms-2 opacity-60 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                      <DropdownMenuRadioItem value="default" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Sắp xếp mặc định" : "Default sorting"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="priceAsc" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Giá: Thấp đến Cao" : "Price: Low to High"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="priceDesc" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Giá: Cao đến Thấp" : "Price: High to Low"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="nameAsc" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        {language === "vi" ? "Tên A-Z" : "Name A-Z"}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Cards grid */}
            {sortedProducts.length > 0 ? (
              <motion.div
                key={selectedCategory + selectedSupplier + selectedFinish + searchQuery}
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {sortedProducts.map((p) => {
                  const supplier = MOCK_SUPPLIERS.find((s) => s.id === p.supplierId);
                  return (
                    <motion.div
                      key={p.id}
                      variants={{
                        hidden: { opacity: 0, y: 24 },
                        visible: { opacity: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.6 } }
                      }}
                      className="h-full"
                    >
                      <Link
                        href={`/products/${p.slug}`}
                        className="bg-white border border-warm-200/80 rounded-2xl p-4 flex flex-col gap-4 relative h-full group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.99] cursor-pointer block"
                      >
                        {/* Image box */}
                        <div className="relative h-48 w-full bg-jotun-ivory-100 rounded-xl overflow-hidden border border-black/5 flex items-center justify-center p-4 shadow-inner">
                          <Image
                            src={p.images?.[0] || "/product_interior.png"}
                            alt={p.name}
                            fill
                            className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                          />
                          {p.discountPercent && p.discountPercent > 0 ? (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-lg shadow-md z-10 animate-pulse select-none border border-white/20">
                              -{p.discountPercent}%
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2 flex-grow text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-warm-400 font-mono">
                              {supplier?.name || "Jotun Premium"}
                            </span>
                            <span className="px-2.5 py-0.5 bg-jotun-teal/10 text-jotun-teal text-[9px] font-bold rounded">
                              {p.volume} {p.volumeUnit}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-base leading-snug line-clamp-2 text-warm-900 group-hover:text-jotun-teal transition-colors duration-300">
                            {language === "vi" ? p.name : p.nameEn}
                          </h3>
                          
                          <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between">
                            <span className="text-[10px] text-warm-400 font-mono font-semibold">SKU: {p.sku}</span>
                            {p.discountPercent && p.discountPercent > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-mono font-bold text-red-500">
                                  {formatPrice(p.price * (1 - p.discountPercent / 100))}
                                </span>
                                <span className="text-[10px] font-mono text-warm-400 line-through">
                                  {formatPrice(p.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-base font-extrabold text-warm-900 font-mono">
                                {formatPrice(p.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="bg-white border border-warm-200/80 rounded-2xl h-96 flex flex-col items-center justify-center text-center p-6 gap-3 shadow-sm">
                <Search className="h-10 w-10 text-warm-450 mb-2 text-jotun-teal" />
                <p className="text-sm font-bold text-warm-600">
                  {language === "vi"
                    ? "Không tìm thấy sản phẩm nào phù hợp với bộ lọc."
                    : "No products match your filters."}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}
