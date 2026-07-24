"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface ProductsClientProps {
  initialPaints: any[];
  initialCategories: any[];
  initialSuppliers: any[];
  commerceAvailable: boolean;
}

export function ProductsClient({
  initialPaints,
  initialCategories,
  initialSuppliers,
  commerceAvailable,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [paints] = useState<any[]>(initialPaints);
  const [categories] = useState<any[]>(initialCategories);
  const [suppliers] = useState<any[]>(initialSuppliers);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedFinish, setSelectedFinish] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      const match = categories.find((c) => c.slug === catParam);
      if (match) setSelectedCategory(match.id);
    }
  }, [searchParams, categories]);

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

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "priceAsc") return a.price - b.price;
    if (sortBy === "priceDesc") return b.price - a.price;
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    return 0;
  });

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedFinish("all");
    setSortBy("default");
    router.replace("/products");
  };

  const activeFilterCount = [
    selectedCategory !== "all",
    selectedSupplier !== "all",
    selectedFinish !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
        <input
          type="text"
          placeholder={language === "vi" ? "Tìm tên sản phẩm..." : "Search..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#88734C]/20 focus:border-[#88734C] transition-all"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">{t.productCategory}</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3.5 py-2.5 h-10 shadow-sm text-left">
              <span className="truncate">
                {selectedCategory === "all"
                  ? (language === "vi" ? "Tất cả danh mục" : "All Categories")
                  : selectedCategory === "promo"
                  ? (language === "vi" ? "Sản phẩm khuyến mãi" : "Sale Products")
                  : (language === "vi"
                    ? categories.find((c: any) => c.id === selectedCategory)?.name
                    : categories.find((c: any) => c.id === selectedCategory)?.nameEn)}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-[200]">
            <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
              <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Tất cả danh mục" : "All Categories"}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="promo" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Sản phẩm khuyến mãi" : "Sale Products"}
              </DropdownMenuRadioItem>
              {categories.map((c: any) => (
                <DropdownMenuRadioItem key={c.id} value={c.id} className="text-xs font-semibold text-warm-900 cursor-pointer">
                  {language === "vi" ? c.name : c.nameEn}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Supplier */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">{t.productSupplier}</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3.5 py-2.5 h-10 shadow-sm text-left">
              <span className="truncate">
                {selectedSupplier === "all"
                  ? (language === "vi" ? "Tất cả hãng sản xuất" : "All Brands")
                  : suppliers.find((s: any) => s.id === selectedSupplier)?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-[200]">
            <DropdownMenuRadioGroup value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Tất cả hãng sản xuất" : "All Brands"}
              </DropdownMenuRadioItem>
              {suppliers.map((s: any) => (
                <DropdownMenuRadioItem key={s.id} value={s.id} className="text-xs font-semibold text-warm-900 cursor-pointer">
                  {s.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Finish */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">{t.productFinish}</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-3.5 py-2.5 h-10 shadow-sm text-left">
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
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-[200]">
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
  );

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300 pt-24 md:pt-32 pb-24">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="py-8 md:py-12 relative overflow-hidden bg-jotun-ivory"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl text-left relative z-10">
          <h1 className="text-3xl md:text-6xl font-serif font-extrabold tracking-tight text-warm-900 mb-3 uppercase leading-none">
            {language === "vi" ? "Sản Phẩm Sơn Nước" : "Paint Products"}
          </h1>
          <p className="text-warm-500 text-sm max-w-2xl font-light leading-relaxed">
            {language === "vi"
              ? "Tìm kiếm giải pháp bảo vệ tối ưu và mang lại vẻ đẹp bền lâu cho công trình của bạn."
              : "Search the ultimate protection solution and bring long-lasting beauty to your project."}
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl relative z-10">
        {!commerceAvailable && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {language === "vi"
              ? "Dữ liệu sản phẩm trực tiếp đang tạm gián đoạn. Bạn vẫn có thể tham khảo danh mục, nhưng chức năng mua hàng đang tạm khóa."
              : "Live product data is temporarily unavailable. You can still browse the catalog, but purchasing is disabled."}
          </div>
        )}
        {/* ── Mobile: top toolbar with filter button + sort ── */}
        <div className="flex lg:hidden items-center gap-2 mb-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm sản phẩm..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#88734C]/20 focus:border-[#88734C] transition-all"
            />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-900 shadow-sm whitespace-nowrap relative"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {language === "vi" ? "Lọc" : "Filter"}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-[#88734C] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="px-3 py-2.5 h-auto bg-white border-warm-200 text-warm-900 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="default" className="text-xs font-semibold text-warm-900 cursor-pointer">
                  {language === "vi" ? "Mặc định" : "Default"}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priceAsc" className="text-xs font-semibold text-warm-900 cursor-pointer">
                  {language === "vi" ? "Giá: Thấp → Cao" : "Price: Low → High"}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priceDesc" className="text-xs font-semibold text-warm-900 cursor-pointer">
                  {language === "vi" ? "Giá: Cao → Thấp" : "Price: High → Low"}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="nameAsc" className="text-xs font-semibold text-warm-900 cursor-pointer">
                  {language === "vi" ? "Tên A-Z" : "Name A-Z"}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter chips (mobile) */}
        {activeFilterCount > 0 && (
          <div className="flex lg:hidden flex-wrap gap-2 mb-4">
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="flex items-center gap-1 px-2.5 py-1 bg-[#88734C]/10 text-[#88734C] rounded-full text-[10px] font-bold">
                "{searchQuery.slice(0, 12)}{searchQuery.length > 12 ? '…' : ''}" <X className="h-3 w-3" />
              </button>
            )}
            {selectedCategory !== "all" && (
              <button onClick={() => setSelectedCategory("all")} className="flex items-center gap-1 px-2.5 py-1 bg-[#88734C]/10 text-[#88734C] rounded-full text-[10px] font-bold">
                {language === "vi" ? categories.find((c: any) => c.id === selectedCategory)?.name : categories.find((c: any) => c.id === selectedCategory)?.nameEn}
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedSupplier !== "all" && (
              <button onClick={() => setSelectedSupplier("all")} className="flex items-center gap-1 px-2.5 py-1 bg-[#88734C]/10 text-[#88734C] rounded-full text-[10px] font-bold">
                {suppliers.find((s: any) => s.id === selectedSupplier)?.name} <X className="h-3 w-3" />
              </button>
            )}
            {selectedFinish !== "all" && (
              <button onClick={() => setSelectedFinish("all")} className="flex items-center gap-1 px-2.5 py-1 bg-[#88734C]/10 text-[#88734C] rounded-full text-[10px] font-bold">
                {selectedFinish} <X className="h-3 w-3" />
              </button>
            )}
            <button onClick={clearAllFilters} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-bold">
              {language === "vi" ? "Xóa tất cả" : "Clear all"} <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* ── Desktop: sticky sidebar filter ── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            className="hidden lg:flex lg:col-span-3 bg-white border border-warm-200/80 rounded-2xl p-6 flex-col gap-6 text-left shadow-sm sticky top-24 self-start"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="font-bold flex items-center gap-2 text-sm text-warm-900">
                <SlidersHorizontal className="h-4 w-4 text-jotun-teal" />
                {language === "vi" ? "Bộ lọc" : "Filters"}
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#88734C] text-white text-[9px] font-bold rounded-full">{activeFilterCount}</span>
                )}
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-jotun-teal hover:underline font-bold">
                  {language === "vi" ? "Xóa bộ lọc" : "Clear all"}
                </button>
              )}
            </div>
            <FilterContent />
          </motion.aside>

          {/* ── Right: products ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
            className="lg:col-span-9 flex flex-col gap-4 lg:gap-6"
          >
            {/* Sorting bar (desktop) */}
            <div className="hidden lg:flex bg-white/80 backdrop-blur-md p-4 border border-black/5 rounded-2xl shadow-xs items-center justify-between gap-4 text-left">
              <span className="text-xs font-bold text-warm-500">
                {language === "vi" ? `Hiển thị ${sortedProducts.length} sản phẩm` : `Showing ${sortedProducts.length} products`}
              </span>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-warm-450" />
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="px-3 py-1.5 h-8 bg-white border-warm-200 text-warm-900 rounded-lg text-xs font-bold flex items-center gap-1">
                      <span>
                        {sortBy === "default" ? (language === "vi" ? "Sắp xếp mặc định" : "Default sorting")
                          : sortBy === "priceAsc" ? (language === "vi" ? "Giá: Thấp đến Cao" : "Price: Low to High")
                          : sortBy === "priceDesc" ? (language === "vi" ? "Giá: Cao đến Thấp" : "Price: High to Low")
                          : (language === "vi" ? "Tên A-Z" : "Name A-Z")}
                      </span>
                      <ChevronDown className="-me-1 ms-2 opacity-60 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                      <DropdownMenuRadioItem value="default" className="text-xs font-semibold text-warm-900 cursor-pointer">{language === "vi" ? "Sắp xếp mặc định" : "Default sorting"}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="priceAsc" className="text-xs font-semibold text-warm-900 cursor-pointer">{language === "vi" ? "Giá: Thấp đến Cao" : "Price: Low to High"}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="priceDesc" className="text-xs font-semibold text-warm-900 cursor-pointer">{language === "vi" ? "Giá: Cao đến Thấp" : "Price: High to Low"}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="nameAsc" className="text-xs font-semibold text-warm-900 cursor-pointer">{language === "vi" ? "Tên A-Z" : "Name A-Z"}</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile results count */}
            <div className="flex lg:hidden items-center justify-between">
              <span className="text-xs font-semibold text-warm-500">
                {language === "vi" ? `${sortedProducts.length} sản phẩm` : `${sortedProducts.length} products`}
              </span>
            </div>

            {/* Cards grid */}
            {sortedProducts.length > 0 ? (
              <motion.div
                key={selectedCategory + selectedSupplier + selectedFinish + searchQuery}
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-8"
              >
                {sortedProducts.map((p) => {
                  return (
                    <motion.div
                      key={p.id}
                      variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.6 } } }}
                      className="h-full"
                    >
                      <Link
                        href={`/products/${p.slug}`}
                        className="bg-white border border-warm-200/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 relative h-full group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] cursor-pointer block"
                      >
                        {/* Image */}
                        <div className="relative h-36 sm:h-48 w-full bg-jotun-ivory-100 rounded-xl overflow-hidden border border-black/5 flex items-center justify-center p-3 sm:p-4 shadow-inner">
                          <Image
                            src={getProductImage(p.images)}
                            alt={p.name}
                            fill
                            className="object-contain p-3 sm:p-4 transition-transform duration-700 group-hover:scale-105"
                          />
                          {p.discountPercent && p.discountPercent > 0 ? (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-md z-10 select-none border border-white/20">
                              -{p.discountPercent}%
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5 flex-grow text-left">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-warm-400 font-mono truncate">
                              {p.supplier?.name || "Jotun"}
                            </span>
                            <span className="px-1.5 py-0.5 bg-jotun-teal/10 text-jotun-teal text-[9px] font-bold rounded shrink-0">
                              {p.volume}{p.volumeUnit}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-sm leading-snug line-clamp-2 text-warm-900 group-hover:text-jotun-teal transition-colors duration-300">
                            {language === "vi" ? p.name : p.nameEn}
                          </h3>

                          <div className="mt-auto pt-2 border-t border-black/5 flex items-center justify-between">
                            <span className="text-[9px] text-warm-400 font-mono hidden sm:block">{p.sku}</span>
                            {p.discountPercent && p.discountPercent > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-mono font-bold text-red-500">
                                  {formatPrice(p.price * (1 - p.discountPercent / 100))}
                                </span>
                                <span className="text-[9px] font-mono text-warm-400 line-through">
                                  {formatPrice(p.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-extrabold text-warm-900 font-mono">
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
              <div className="bg-white border border-warm-200/80 rounded-2xl h-60 flex flex-col items-center justify-center text-center p-6 gap-3 shadow-sm">
                <Search className="h-8 w-8 text-warm-300 mb-1" />
                <p className="text-sm font-bold text-warm-600">
                  {language === "vi" ? "Không tìm thấy sản phẩm nào." : "No products match your filters."}
                </p>
                <button onClick={clearAllFilters} className="text-xs text-[#88734C] font-bold hover:underline">
                  {language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Mobile filter bottom sheet ── */}
      <AnimatePresence>
        {filterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={() => setFilterOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto lg:hidden"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-warm-200 rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base text-warm-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#88734C]" />
                  {language === "vi" ? "Bộ lọc" : "Filters"}
                </h3>
                <button onClick={() => setFilterOpen(false)} className="p-2 rounded-xl text-warm-400 hover:text-warm-900 hover:bg-warm-50 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <FilterContent />

              {/* Apply button */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-3 rounded-xl border border-warm-200 text-warm-700 text-sm font-bold hover:bg-warm-50 transition-all"
                >
                  {language === "vi" ? "Xóa bộ lọc" : "Clear"}
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-warm-900 text-white text-sm font-bold hover:bg-warm-800 transition-all"
                >
                  {language === "vi" ? `Xem ${sortedProducts.length} sản phẩm` : `View ${sortedProducts.length} items`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
