/* Hallmark · genre: editorial · macrostructure: 02 Long Document · design-system: design.md · designed-as-app */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { PaintColor } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { toast } from "@/components/ui/csp-toast";
import {
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  findClosestColor
} from "@/lib/color-utils";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { SpecLedger, SwatchChip, Rule, type SpecRow } from "@/components/ui/editorial";

interface ProductClientProps {
  initialProduct: any;
  initialRelatedPaints: any[];
  initialColorCatalog: any[];
  initialReviews: any[];
}

/**
 * Product detail as a long document: gallery and continuous prose in the wide
 * 8-column measure, the purchase ledger in the narrow 4-column margin.
 * Typography only — no drench, no enrichment; boundaries are hairline rules.
 */
export function ProductClient({
  initialProduct,
  initialRelatedPaints,
  initialColorCatalog,
  initialReviews,
}: ProductClientProps) {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const { addItem } = useCartStore();
  const { status: authStatus } = useSession();

  const [mounted, setMounted] = useState(false);
  const [paint] = useState(initialProduct);
  const [relatedPaints] = useState(initialRelatedPaints);
  const [colorCatalog] = useState(initialColorCatalog);
  const [selectedColor, setSelectedColor] = useState<PaintColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    setMounted(true);
    if (paint?.colorDetails?.[0]) {
      setSelectedColor(paint.colorDetails[0]);
    }
  }, [paint]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !paint) return;
    fetch("/api/profile/favorite-products")
      .then((response) => response.json())
      .then((products) => {
        if (Array.isArray(products)) setIsFavorite(products.some((product) => product.id === paint.id));
      })
      .catch((error) => console.error("Không thể tải sản phẩm yêu thích:", error));
  }, [authStatus, paint]);

  if (!mounted) return null;

  if (!paint) {
    return (
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <h2 className="fl-display text-fl-2xl text-atelier-ink">
          {language === "vi" ? "Sản phẩm không tồn tại" : "Product Not Found"}
        </h2>
        <Link
          href="/products"
          className="mt-fl-sm inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
        >
          <span aria-hidden="true">←</span>
          {language === "vi" ? "Quay lại danh sách sản phẩm" : "Back to products"}
        </Link>
      </div>
    );
  }

  const category = paint.category;
  const supplier = paint.supplier;

  // Find detailed color objects
  const availableColors = colorCatalog.filter((c) => paint.colors.includes(c.code));

  // Coordinating Palettes
  const complementaryColorMatches: PaintColor[] = [];
  const analogousColorMatches: PaintColor[] = [];
  const triadicColorMatches: PaintColor[] = [];

  if (selectedColor) {
    // Complementary
    const compHexes = getComplementaryColors(selectedColor.hex);
    compHexes.forEach((hex) => {
      const match = findClosestColor(hex, colorCatalog);
      if (match) complementaryColorMatches.push(match);
    });

    // Analogous
    const analHexes = getAnalogousColors(selectedColor.hex);
    analHexes.forEach((hex) => {
      const match = findClosestColor(hex, colorCatalog);
      if (match && !analogousColorMatches.some((m) => m.code === match.code)) {
        analogousColorMatches.push(match);
      }
    });

    // Triadic
    const triHexes = getTriadicColors(selectedColor.hex);
    triHexes.forEach((hex) => {
      const match = findClosestColor(hex, colorCatalog);
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

  const handleToggleFavoriteProduct = async () => {
    if (isUpdatingFavorite) return;
    if (authStatus !== "authenticated") {
      toast.info(language === "vi" ? "Vui lòng đăng nhập để lưu sản phẩm." : "Please sign in to save products.");
      router.push("/login");
      return;
    }
    const previous = isFavorite;
    setIsUpdatingFavorite(true);
    setIsFavorite(!previous);
    try {
      const response = await fetch("/api/profile/favorite-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paintId: paint.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật sản phẩm yêu thích");
      setIsFavorite(data.favorited);
      toast.success(
        data.favorited
          ? language === "vi" ? "Đã lưu sản phẩm vào mục yêu thích." : "Product saved to favorites."
          : language === "vi" ? "Đã bỏ sản phẩm khỏi mục yêu thích." : "Product removed from favorites.",
      );
    } catch (error) {
      setIsFavorite(previous);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật sản phẩm yêu thích");
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paintId: paint.id, rating: reviewRating, comment: reviewComment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi đánh giá");
      setReviews((current) => [data, ...current.filter((review) => review.id !== data.id)]);
      setReviewComment("");
      toast.success(language === "vi" ? "Đã lưu đánh giá của bạn." : "Your review was saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi đánh giá");
    }
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

  const hasDiscount = Boolean(paint.discountPercent && paint.discountPercent > 0);
  const finalPrice = hasDiscount
    ? paint.price * (1 - (paint.discountPercent || 0) / 100)
    : paint.price;

  /* One SpecLedger — only rows whose data already exists on the product.
     No fallback values are invented; a missing datum means a missing row. */
  const specRows: SpecRow[] = [
    paint.finish ? { label: t.productFinish, value: paint.finish } : null,
    paint.coverage
      ? { label: t.productCoverage, value: `${paint.coverage} m²/lít/lớp` }
      : null,
    paint.coatsRequired
      ? {
          label: t.productCoats,
          value: `${paint.coatsRequired} ${language === "vi" ? "lớp" : "coats"}`,
        }
      : null,
    paint.dryingTime ? { label: t.productDrying, value: paint.dryingTime } : null,
    paint.volume
      ? { label: t.productVolume, value: `${paint.volume} ${paint.volumeUnit}` }
      : null,
  ].filter(Boolean) as SpecRow[];

  const paletteGroup = (label: string, colors: PaintColor[]) =>
    colors.length > 0 ? (
      <div className="flex flex-col gap-fl-2xs">
        <span className="fl-label">{label}</span>
        <div className="flex flex-col">
          {colors.map((col) => (
            <button
              key={col.code}
              type="button"
              onClick={() => setSelectedColor(col)}
              className="group flex min-h-11 items-center gap-fl-2xs border-b border-atelier-rule py-fl-2xs text-left"
            >
              <ColorSwatch
                color={col.hex}
                className="h-6 w-6 shrink-0 rounded-swatch border border-atelier-rule"
              />
              <span className="min-w-0 flex-1 truncate text-fl-xs text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out group-hover:text-atelier-ink">
                {language === "vi" ? col.name : col.nameEn}
              </span>
              <span className="fl-label ml-auto shrink-0">{col.code}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] pb-fl-2xl pt-fl-md text-atelier-ink">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-fl-sm text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-6"
      >
        <span aria-hidden="true">←</span>
        {language === "vi" ? "Quay lại danh sách sản phẩm" : "Back to products"}
      </Link>

      {/* Asymmetric 8/4: document left, purchase ledger right */}
      <div className="mt-fl-md grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
        {/* Gallery — wide column */}
        <figure className="lg:col-span-8">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2">
            <Image
              src={getProductImage(paint.images)}
              alt={paint.name}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
          {selectedColor && (
            <figcaption className="mt-fl-xs flex items-center gap-fl-xs border-t border-atelier-rule pt-fl-xs">
              <ColorSwatch
                color={selectedColor.hex}
                className="h-8 w-8 shrink-0 rounded-swatch border border-atelier-rule"
              />
              <span className="fl-label">
                {language === "vi" ? "Màu đã chọn" : "Selected color"}
              </span>
              <span className="min-w-0 truncate text-fl-sm">
                {language === "vi" ? selectedColor.name : selectedColor.nameEn} ({selectedColor.code})
              </span>
            </figcaption>
          )}
        </figure>

        {/* Purchase ledger — narrow column, spans both grid rows on desktop */}
        <div className="lg:col-span-4 lg:row-span-2 lg:border-l lg:border-atelier-rule lg:pl-fl-lg">
          <p className="fl-label">
            {supplier?.name}
            {category ? ` · ${language === "vi" ? category?.name : category?.nameEn}` : ""}
          </p>
          <h1 className="fl-display mt-fl-2xs text-fl-2xl text-atelier-ink">
            {language === "vi" ? paint.name : paint.nameEn}
          </h1>
          <p className="fl-label mt-fl-2xs">SKU {paint.sku}</p>

          <Rule className="mt-fl-md" />

          {/* Price line — the discount folds into the line, no badge */}
          <div className="mt-fl-md">
            <span className="fl-label">
              {language === "vi" ? "Đơn giá lẻ" : "Retail price"}
            </span>
            <p className="mt-fl-2xs flex flex-wrap items-baseline gap-fl-xs">
              <span
                className={cn(
                  "text-fl-2xl tabular-nums",
                  hasDiscount ? "text-atelier-danger" : "text-atelier-ink",
                )}
              >
                {formatPrice(finalPrice)}
              </span>
              {hasDiscount ? (
                <>
                  <span className="text-fl-sm tabular-nums text-atelier-ink-3 line-through">
                    {formatPrice(paint.price)}
                  </span>
                  <span className="fl-label !text-atelier-danger">
                    −{paint.discountPercent}%
                  </span>
                </>
              ) : null}
            </p>
            <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
              {t.productVolume}: <span className="tabular-nums">{paint.volume} {paint.volumeUnit}</span>
            </p>
          </div>

          {/* Colour selection — hard-edged chips, behaviour unchanged */}
          {availableColors.length > 0 && (
            <div className="mt-fl-md border-t border-atelier-rule pt-fl-md">
              <span className="fl-label">
                {language === "vi" ? "Chọn màu sơn" : "Select paint color"}
              </span>
              <div className="mt-fl-xs flex flex-wrap gap-fl-2xs">
                {availableColors.map((color) => (
                  <SwatchChip
                    key={color.code}
                    hex={color.hex}
                    name={language === "vi" ? color.name : color.nameEn || color.name}
                    code={color.code}
                    layout="chip"
                    selected={selectedColor?.code === color.code}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>

              {/* Coordinating palettes — hairline rows, no boxes */}
              {selectedColor && (
                <div className="mt-fl-md flex flex-col gap-fl-md">
                  <span className="fl-label">
                    {language === "vi" ? "Phối màu gợi ý" : "Coordinating palettes"}
                  </span>
                  {paletteGroup(t.complementaryColors, complementaryColorMatches)}
                  {paletteGroup(t.analogousColors, analogousColorMatches)}
                  {paletteGroup(t.triadicColors, triadicColorMatches)}
                </div>
              )}
            </div>
          )}

          {/* Quantity + actions */}
          <div className="mt-fl-md flex flex-col gap-fl-sm border-t border-atelier-rule pt-fl-md">
            <div className="inline-flex w-fit items-center rounded-control border border-atelier-rule-strong">
              <button
                type="button"
                aria-label={language === "vi" ? "Giảm số lượng" : "Decrease quantity"}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="min-h-11 min-w-11 text-fl-md text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-10 md:min-w-10"
              >
                −
              </button>
              <span className="min-w-10 px-fl-xs text-center text-fl-sm tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label={language === "vi" ? "Tăng số lượng" : "Increase quantity"}
                onClick={() => setQuantity((q) => q + 1)}
                className="min-h-11 min-w-11 text-fl-md text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-10 md:min-w-10"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-atelier-accent px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-accent-ink transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-accent-hover"
            >
              {t.addToCart}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-atelier-ink px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-paper transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-espresso"
            >
              {t.buyNow}
            </button>
            <button
              type="button"
              onClick={handleToggleFavoriteProduct}
              disabled={isUpdatingFavorite}
              aria-pressed={isFavorite}
              aria-label={language === "vi" ? "Lưu sản phẩm yêu thích" : "Save favorite product"}
              className="min-h-11 self-start whitespace-nowrap text-fl-sm font-medium text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-[text-decoration-thickness,color] duration-fl-fast ease-fl-out hover:text-atelier-ink hover:decoration-2 disabled:cursor-wait disabled:opacity-60 md:min-h-6"
            >
              {isFavorite
                ? language === "vi" ? "Đã lưu vào yêu thích" : "Saved to favorites"
                : language === "vi" ? "Lưu vào yêu thích" : "Save to favorites"}
            </button>
          </div>

          {/* Assurances — plain metadata lines, no icon tiles */}
          <ul className="mt-fl-md flex flex-col gap-fl-2xs border-t border-atelier-rule pt-fl-md text-fl-sm text-atelier-ink-2">
            <li>
              <span className="font-medium text-atelier-ink">
                {language === "vi" ? "Chính hãng 100%" : "100% Genuine"}
              </span>{" "}
              — {language === "vi" ? "Bảo hành nhà máy" : "Factory warranty"}
            </li>
            <li>
              <span className="font-medium text-atelier-ink">
                {language === "vi" ? "Giao hàng nhanh" : "Fast Delivery"}
              </span>{" "}
              — {language === "vi" ? "Nội thành 24h" : "Within 24h local"}
            </li>
            <li>
              <span className="font-medium text-atelier-ink">
                {language === "vi" ? "Đổi trả dễ dàng" : "Easy Return"}
              </span>{" "}
              — {language === "vi" ? "Trong vòng 7 ngày" : "Within 7 days"}
            </li>
          </ul>
        </div>

        {/* The document — continuous prose, inline section heads, hairline rules */}
        <div className="lg:col-span-8">
          <section className="border-t border-atelier-rule pt-fl-lg">
            <h2 className="fl-display text-fl-xl text-atelier-ink">{t.tabDescription}</h2>
            <p className="fl-measure mt-fl-sm text-fl-md text-atelier-ink-2">
              {language === "vi" ? paint.description : paint.descriptionEn}
            </p>
          </section>

          {(language === "vi" ? paint.features : paint.featuresEn) ? (
            <section className="mt-fl-xl border-t border-atelier-rule pt-fl-lg">
              <h2 className="fl-display text-fl-xl text-atelier-ink">{t.tabFeatures}</h2>
              <ul className="fl-measure mt-fl-sm flex flex-col">
                {(language === "vi" ? paint.features : paint.featuresEn)
                  ?.split(", ")
                  .map((feat: string, index: number) => (
                    <li
                      key={index}
                      className="border-b border-atelier-rule py-fl-xs text-fl-md text-atelier-ink-2"
                    >
                      {feat}
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          {paint.application ? (
            <section className="mt-fl-xl border-t border-atelier-rule pt-fl-lg">
              <h2 className="fl-display text-fl-xl text-atelier-ink">{t.tabApplication}</h2>
              <p className="fl-measure mt-fl-sm text-fl-md text-atelier-ink-2">
                {paint.application}
              </p>
            </section>
          ) : null}

          <section className="mt-fl-xl border-t border-atelier-rule pt-fl-lg">
            <h2 className="fl-display text-fl-xl text-atelier-ink">{t.tabSpecs}</h2>
            {paint.specifications ? (
              <p className="fl-measure mt-fl-sm text-fl-md text-atelier-ink-2">
                {paint.specifications}
              </p>
            ) : null}
            {specRows.length > 0 ? (
              <SpecLedger rows={specRows} columns={2} className="mt-fl-md" />
            ) : null}
          </section>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-fl-2xl border-t border-atelier-rule-strong pt-fl-xl">
        <div className="grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
          <div className="lg:col-span-7">
            <h2 className="fl-display text-fl-2xl text-atelier-ink">
              {language === "vi" ? "Đánh giá khách hàng" : "Customer Reviews"}
            </h2>
            <div className="mt-fl-md flex flex-col">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article key={review.id} className="border-b border-atelier-rule py-fl-md">
                    <div className="flex items-baseline justify-between gap-fl-sm">
                      <strong className="text-fl-sm font-medium text-atelier-ink">
                        {review.author}
                      </strong>
                      <span
                        className="flex text-atelier-ochre"
                        role="img"
                        aria-label={`${review.rating}/5`}
                      >
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            aria-hidden="true"
                            className={cn(
                              "h-3.5 w-3.5",
                              index < review.rating ? "fill-current" : "opacity-25",
                            )}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="fl-measure mt-fl-xs text-fl-sm text-atelier-ink-2">
                      {review.comment}
                    </p>
                    {review.adminReply && (
                      <p className="mt-fl-xs border-l border-atelier-rule-strong pl-fl-sm text-fl-sm text-atelier-ink-2">
                        <strong className="font-medium text-atelier-ink">FLOF:</strong>{" "}
                        {review.adminReply}
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <p className="text-fl-sm text-atelier-ink-2">
                  {language === "vi" ? "Chưa có đánh giá cho sản phẩm này." : "No reviews yet."}
                </p>
              )}
            </div>
          </div>

          <form
            onSubmit={handleReviewSubmit}
            className="lg:col-span-5 lg:border-l lg:border-atelier-rule lg:pl-fl-lg"
          >
            <h3 className="fl-display text-fl-xl text-atelier-ink">
              {language === "vi" ? "Viết đánh giá" : "Write a Review"}
            </h3>
            <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
              {language === "vi"
                ? "Chỉ đơn hàng đã hoàn tất mới có thể đánh giá."
                : "Only completed purchases can be reviewed."}
            </p>
            <div className="mt-fl-sm flex gap-fl-3xs">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setReviewRating(index + 1)}
                  aria-label={`${index + 1} stars`}
                  aria-pressed={index < reviewRating}
                  className="flex h-11 w-11 items-center justify-center text-atelier-ochre md:h-9 md:w-9"
                >
                  <Star
                    className={cn("h-6 w-6", index < reviewRating ? "fill-current" : "opacity-25")}
                  />
                </button>
              ))}
            </div>
            <textarea
              required
              minLength={5}
              maxLength={2000}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder={
                language === "vi"
                  ? "Chia sẻ trải nghiệm sử dụng sản phẩm..."
                  : "Share your product experience..."
              }
              className="mt-fl-sm min-h-32 w-full rounded-control border border-atelier-rule-strong bg-atelier-paper-2 p-fl-xs text-fl-sm text-atelier-ink outline-none transition-colors duration-fl-fast ease-fl-out placeholder:text-atelier-ink-3 hover:border-atelier-ink-3 focus-visible:border-atelier-accent"
            />
            <button className="mt-fl-sm inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-atelier-ink px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-paper transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-espresso md:min-h-10">
              {language === "vi" ? "Gửi đánh giá" : "Submit Review"}
            </button>
          </form>
        </div>
      </section>

      {/* Related products — dense catalogue rhythm on hairlines */}
      {relatedPaints.length > 0 && (
        <section className="mt-fl-2xl border-t border-atelier-rule-strong pt-fl-xl">
          <h2 className="fl-display text-fl-2xl text-atelier-ink">{t.relatedProducts}</h2>
          <div className="mt-fl-md grid grid-cols-2 gap-x-fl-md gap-y-fl-lg md:grid-cols-3">
            {relatedPaints.map((item) => {
              const itemSupplier = item.supplier;
              const itemName = language === "vi" ? item.name : item.nameEn || item.name;
              return (
                <article
                  key={item.id}
                  className="flex min-w-0 flex-col border-t border-atelier-rule pt-fl-sm"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative block aspect-[4/3] overflow-hidden rounded-surface bg-atelier-paper-2"
                  >
                    <Image
                      src={getProductImage(item.images)}
                      alt={itemName}
                      fill
                      sizes="(min-width: 768px) 30vw, 45vw"
                      className="object-contain p-fl-xs"
                    />
                  </Link>
                  <p className="fl-label mt-fl-xs truncate">
                    {itemSupplier?.name} · {item.volume} {item.volumeUnit}
                  </p>
                  <Link href={`/products/${item.slug}`} className="mt-fl-2xs block">
                    <h3 className="truncate font-serif text-fl-md text-atelier-ink">{itemName}</h3>
                  </Link>
                  <p className="mt-auto pt-fl-2xs text-fl-sm tabular-nums text-atelier-ink">
                    {formatPrice(item.price)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
