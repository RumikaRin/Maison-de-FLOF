/* Hallmark · genre: editorial · macrostructure: 11 Catalogue · design-system: design.md · designed-as-app */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, Grid2X2, Square } from "lucide-react";
import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { cn, formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { safeMotion, useReducedMotion } from "@/components/ui/motion-safe";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import {
  EditorialHeading,
  EditorialSection,
  Rule,
} from "@/components/ui/editorial";

interface ProductsClientProps {
  initialPaints: any[];
  initialCategories: any[];
  initialSuppliers: any[];
  commerceAvailable: boolean;
}

type FilterOption = { value: string; label: string };

type ProductFilterFieldsProps = {
  language: "vi" | "en";
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryOptions: FilterOption[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  supplierOptions: FilterOption[];
  selectedSupplier: string;
  setSelectedSupplier: (value: string) => void;
  finishOptions: FilterOption[];
  selectedFinish: string;
  setSelectedFinish: (value: string) => void;
  sortOptions: FilterOption[];
  sortBy: string;
  setSortBy: (value: string) => void;
  categoryLabel: string;
  supplierLabel: string;
  finishLabel: string;
  sortLabel: string;
  chipClass: (active: boolean) => string;
};

function ProductFilterFields({
  language,
  searchQuery,
  setSearchQuery,
  categoryOptions,
  selectedCategory,
  setSelectedCategory,
  supplierOptions,
  selectedSupplier,
  setSelectedSupplier,
  finishOptions,
  selectedFinish,
  setSelectedFinish,
  sortOptions,
  sortBy,
  setSortBy,
  categoryLabel,
  supplierLabel,
  finishLabel,
  sortLabel,
  chipClass,
}: ProductFilterFieldsProps) {
  return (
    <div className="flex flex-col gap-fl-md">
      <div>
        <label htmlFor="mobile-catalogue-search" className="fl-label block">
          {language === "vi" ? "Tìm kiếm" : "Search"}
        </label>
        <Input
          id="mobile-catalogue-search"
          type="text"
          placeholder={
            language === "vi" ? "Nhập tên hoặc SKU..." : "Search name or SKU..."
          }
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="mt-fl-2xs"
        />
      </div>

      <div>
        <span className="fl-label block">{categoryLabel}</span>
        <div className="mt-fl-2xs flex flex-wrap gap-fl-2xs">
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={selectedCategory === option.value}
              onClick={() => setSelectedCategory(option.value)}
              className={chipClass(selectedCategory === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="fl-label block">{supplierLabel}</span>
        <div className="mt-fl-2xs">
          <CustomSelect
            value={selectedSupplier}
            onValueChange={setSelectedSupplier}
            options={supplierOptions}
          />
        </div>
      </div>

      <div>
        <span className="fl-label block">{finishLabel}</span>
        <div className="mt-fl-2xs">
          <CustomSelect
            value={selectedFinish}
            onValueChange={setSelectedFinish}
            options={finishOptions}
          />
        </div>
      </div>

      <div>
        <span className="fl-label block">{sortLabel}</span>
        <div className="mt-fl-2xs">
          <CustomSelect value={sortBy} onValueChange={setSortBy} options={sortOptions} />
        </div>
      </div>
    </div>
  );
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
  const reduceMotion = useReducedMotion();

  const [paints] = useState<any[]>(initialPaints);
  const [categories] = useState<any[]>(initialCategories);
  const [suppliers] = useState<any[]>(initialSuppliers);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedFinish, setSelectedFinish] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // Mobile optimization states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(2);

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

  /* C1 outlined rectangular chip — the tertiary CTA voice, filters only. */
  const chipClass = (active: boolean) =>
    cn(
      "min-h-11 whitespace-nowrap rounded-control border px-fl-sm text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-10",
      active
        ? "border-atelier-ink bg-atelier-ink text-atelier-paper"
        : "border-atelier-rule-strong text-atelier-ink-2 hover:border-atelier-ink hover:text-atelier-ink",
    );

  const categoryOptions: { value: string; label: string }[] = [
    { value: "all", label: language === "vi" ? "Tất cả danh mục" : "All categories" },
    { value: "promo", label: language === "vi" ? "Khuyến mãi" : "On sale" },
    ...categories.map((c: any) => ({
      value: c.id,
      label: language === "vi" ? c.name : c.nameEn,
    })),
  ];

  const supplierOptions: { value: string; label: string }[] = [
    { value: "all", label: language === "vi" ? "Tất cả hãng" : "All brands" },
    ...suppliers.map((s: any) => ({ value: s.id, label: s.name })),
  ];

  const finishOptions: { value: string; label: string }[] = [
    { value: "all", label: language === "vi" ? "Tất cả bề mặt" : "All finishes" },
    { value: "MATTE", label: language === "vi" ? "Mờ / Matte" : "Matte" },
    { value: "GLOSS", label: language === "vi" ? "Bóng / Gloss" : "Gloss" },
    { value: "SEMI_GLOSS", label: language === "vi" ? "Bán bóng / Semi-Gloss" : "Semi-Gloss" },
  ];

  const sortOptions: { value: string; label: string }[] = [
    { value: "default", label: language === "vi" ? "Mặc định" : "Default" },
    { value: "priceAsc", label: language === "vi" ? "Giá tăng dần" : "Price low–high" },
    { value: "priceDesc", label: language === "vi" ? "Giá giảm dần" : "Price high–low" },
    { value: "nameAsc", label: language === "vi" ? "Tên A–Z" : "Name A–Z" },
  ];

  const priceLine = (p: any) => {
    const hasDiscount = Boolean(p.discountPercent && p.discountPercent > 0);
    const finalPrice = hasDiscount ? p.price * (1 - (p.discountPercent || 0) / 100) : p.price;
    return { hasDiscount, finalPrice };
  };

  const mobileFilterTitle = language === "vi" ? "Bộ lọc sản phẩm" : "Product Filters";
  const mobileResultLabel =
    language === "vi"
      ? `Xem (${sortedProducts.length} sản phẩm)`
      : `View (${sortedProducts.length} items)`;

  return (
    <div className="bg-atelier-paper text-atelier-ink">
      <EditorialSection rhythm="tight">
        {/* Inventory header — count and qualifier, no marketing display */}
        <EditorialHeading as="h1" scale="3xl" label={t.catalogueShopEyebrow}>
          {t.catalogueProductsTitle}
        </EditorialHeading>
        <p className="fl-measure mt-fl-sm text-fl-sm text-atelier-ink-2">
          {paints.length} {t.catalogueItemsLabel} ·{" "}
          {language === "vi"
            ? "Giải pháp bảo vệ tối ưu và vẻ đẹp bền lâu cho công trình của bạn."
            : "The ultimate protection and long-lasting beauty for your project."}
        </p>

        {!commerceAvailable && (
          <p
            role="status"
            className="mt-fl-md border-t border-atelier-rule-strong pt-fl-xs text-fl-sm text-atelier-ink-2"
          >
            {language === "vi"
              ? "Dữ liệu sản phẩm trực tiếp đang tạm gián đoạn. Bạn vẫn có thể tham khảo danh mục, nhưng chức năng mua hàng đang tạm khóa."
              : "Live product data is temporarily unavailable. You can still browse the catalog, but purchasing is disabled."}
          </p>
        )}

        <Rule className="mt-fl-lg" weight="strong" />

        {/* MOBILE STICKY TOOLBAR & GRID TOGGLE (Mobile-first UX) */}
        <div className="mt-fl-md flex items-center justify-between gap-fl-xs rounded-control border border-atelier-rule-strong bg-atelier-paper-2 p-fl-xs md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 rounded-control bg-atelier-ink px-3 py-2 text-fl-sm font-medium text-atelier-paper shadow-sm touch-target"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{language === "vi" ? "Bộ lọc" : "Filters"}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-control bg-atelier-accent px-1 text-[11px] font-bold text-atelier-accent-ink">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-fl-xs text-atelier-ink-2">
              {sortedProducts.length} {t.catalogueItemsLabel}
            </span>
            <div className="flex items-center rounded-control border border-atelier-rule p-0.5 bg-atelier-paper">
              <button
                type="button"
                onClick={() => setMobileGridCols(1)}
                className={cn(
                  "rounded-control p-1.5 transition-colors touch-target",
                  mobileGridCols === 1 ? "bg-atelier-ink text-atelier-paper" : "text-atelier-ink-2",
                )}
                aria-label="1 column grid"
              >
                <Square className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileGridCols(2)}
                className={cn(
                  "rounded-control p-1.5 transition-colors touch-target",
                  mobileGridCols === 2 ? "bg-atelier-ink text-atelier-paper" : "text-atelier-ink-2",
                )}
                aria-label="2 columns grid"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP FILTER RAIL (Hidden on mobile) */}
        <div className="mt-fl-md hidden flex-col gap-fl-sm md:flex">
          {/* Toolbar — search, the three secondary facets, and the count */}
          <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <label htmlFor="catalogue-search" className="fl-label">
                {language === "vi" ? "Tìm kiếm" : "Search"}
              </label>
              <Input
                id="catalogue-search"
                type="text"
                placeholder={
                  language === "vi" ? "Tìm theo tên hoặc mã SKU…" : "Search by name or SKU…"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-fl-2xs"
              />
            </div>

            <div className="md:col-span-3">
              <span id="filter-supplier-label" className="fl-label">
                {t.productSupplier}
              </span>
              <div className="mt-fl-2xs">
                <CustomSelect
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                  options={supplierOptions}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="fl-label">{t.productFinish}</span>
              <div className="mt-fl-2xs">
                <CustomSelect
                  value={selectedFinish}
                  onValueChange={setSelectedFinish}
                  options={finishOptions}
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <span className="fl-label">{t.catalogueSortLabel}</span>
              <div className="mt-fl-2xs">
                <CustomSelect
                  value={sortBy}
                  onValueChange={setSortBy}
                  options={sortOptions}
                />
              </div>
            </div>
          </div>

          {/* Primary facet stays as chips */}
          <div className="flex flex-wrap items-center gap-fl-2xs">
            <span className="fl-label mr-fl-2xs">{t.productCategory}</span>
            <div role="group" aria-label={t.productCategory} className="flex flex-wrap gap-fl-2xs">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selectedCategory === option.value}
                  onClick={() => setSelectedCategory(option.value)}
                  className={chipClass(selectedCategory === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
              >
                {t.catalogueClearFilters} ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        <MobileSheet
          closeLabel={language === "vi" ? "Đóng bộ lọc" : "Close filters"}
          onClose={() => setIsMobileFilterOpen(false)}
          open={isMobileFilterOpen}
          title={mobileFilterTitle}
        >
          <ProductFilterFields
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryOptions={categoryOptions}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            supplierOptions={supplierOptions}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            finishOptions={finishOptions}
            selectedFinish={selectedFinish}
            setSelectedFinish={setSelectedFinish}
            sortOptions={sortOptions}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categoryLabel={t.productCategory}
            supplierLabel={t.productSupplier}
            finishLabel={t.productFinish}
            sortLabel={t.catalogueSortLabel}
            chipClass={chipClass}
          />
          <div className="mt-fl-lg flex items-center gap-fl-sm border-t border-atelier-rule pt-fl-sm">
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4"
              >
                {t.catalogueClearFilters}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="ml-auto min-h-11 whitespace-nowrap rounded-control bg-atelier-accent px-fl-md text-fl-sm font-medium text-atelier-accent-ink"
            >
              {mobileResultLabel}
            </button>
          </div>
        </MobileSheet>

        <div className="mt-fl-md hidden items-baseline justify-between gap-fl-sm border-t border-atelier-rule pt-fl-xs md:flex">
          <p className="text-fl-sm text-atelier-ink-2" aria-live="polite">
            {sortedProducts.length} {t.catalogueItemsLabel}
          </p>
        </div>

        {/* F6 product grid — dynamic mobile columns */}
        {sortedProducts.length > 0 ? (
          <safeMotion.div
            key={selectedCategory + selectedSupplier + selectedFinish + searchQuery + sortBy + mobileGridCols}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.24 }}
            data-mobile-grid={mobileGridCols}
            className={cn(
              "mt-fl-sm grid gap-x-fl-md gap-y-fl-lg md:grid-cols-4",
              mobileGridCols === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {sortedProducts.map((p) => {
              const { hasDiscount, finalPrice } = priceLine(p);
              const name = language === "vi" ? p.name : p.nameEn || p.name;
              return (
                <article key={p.id} className="flex min-w-0 flex-col border-t border-atelier-rule pt-fl-sm">
                  <Link
                    href={`/products/${p.slug}`}
                    className="relative block aspect-[4/3] overflow-hidden rounded-surface bg-atelier-paper-2"
                  >
                    <Image
                      src={getProductImage(p.images)}
                      alt={name}
                      fill
                      sizes="(min-width: 768px) 22vw, 45vw"
                      className="object-contain p-fl-xs"
                    />
                  </Link>
                  <p className="fl-label mt-fl-xs truncate">
                    {p.supplier?.name || "Maison de FLOF"} · {p.volume}
                    {p.volumeUnit}
                  </p>
                  <Link href={`/products/${p.slug}`} className="mt-fl-2xs block">
                    <h2 className="truncate font-serif text-fl-md text-atelier-ink">{name}</h2>
                  </Link>
                  <div className="mt-auto flex items-baseline justify-between gap-fl-2xs pt-fl-2xs">
                    <span
                      className={cn(
                        "text-fl-sm tabular-nums",
                        hasDiscount ? "text-atelier-danger" : "text-atelier-ink",
                      )}
                    >
                      {formatPrice(finalPrice)}
                      {hasDiscount ? (
                        <span className="ml-1 text-fl-2xs">−{p.discountPercent}%</span>
                      ) : null}
                    </span>
                    <Link
                      href={`/products/${p.slug}`}
                      className="min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                      aria-label={
                        language === "vi" ? `Xem ${p.name}` : `View ${p.nameEn || p.name}`
                      }
                    >
                      {t.catalogueViewProduct}
                    </Link>
                  </div>
                </article>
              );
            })}
          </safeMotion.div>
        ) : (
          /* Editorial empty state: a rule, a line of Playfair, one action. */
          <div className="mt-fl-sm border-t border-atelier-rule pt-fl-lg">
            <p className="fl-display max-w-xl text-fl-xl text-atelier-ink">
              {language === "vi"
                ? "Không tìm thấy sản phẩm nào phù hợp."
                : "No products match your filters."}
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-fl-sm min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
            >
              {t.catalogueClearFilters}
            </button>
          </div>
        )}
      </EditorialSection>
    </div>
  );
}
