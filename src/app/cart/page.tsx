/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { Minus, Plus } from "lucide-react";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rule, TypographicLink } from "@/components/ui/editorial";

export default function CartPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const {
    items,
    updateQuantity,
    removeItem,
    getCartTotal,
    getCartItemCount,
    clearCart
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50000;
  const total = Math.max(0, subtotal + shippingFee - appliedDiscount);
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCode.trim()) return;

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Invalid coupon"));
      }

      setCouponCode(data.code);
      setAppliedDiscount(data.discount);
      toast.success(
        language === "vi"
          ? `Đã áp dụng mã giảm giá ${formatPrice(data.discount)}.`
          : `Coupon applied: ${formatPrice(data.discount)} off.`,
      );
      setCouponOpen(false);
    } catch (error) {
      setAppliedDiscount(0);
      setCouponError(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Mã giảm giá không hợp lệ."
            : "Invalid coupon code.",
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-atelier-paper pb-32 pt-24 text-left text-atelier-ink md:pb-24">
      <div className="mx-auto w-full max-w-5xl px-[clamp(1rem,4vw,1.5rem)]">

        {/* Header line */}
        <div className="flex items-end justify-between gap-fl-sm">
          <h1 className="fl-display text-fl-2xl">
            {language === "vi" ? "Giỏ hàng" : "Cart"}
            {items.length > 0 && (
              <span className="ml-2 font-sans text-fl-sm tabular-nums text-atelier-ink-2">
                ({getCartItemCount()})
              </span>
            )}
          </h1>
          <TypographicLink href="/products" arrow="→">
            {language === "vi" ? "Tiếp tục mua hàng" : "Continue shopping"}
          </TypographicLink>
        </div>
        <Rule weight="strong" className="mt-fl-sm" />

        {items.length === 0 ? (
          <div className="py-fl-2xl">
            <p className="fl-display text-fl-xl">{t.cartEmpty}</p>
            <p className="fl-measure-tight mt-fl-2xs text-fl-sm text-atelier-ink-2">
              {language === "vi"
                ? "Duyệt danh mục sơn nước cao cấp để lựa chọn sản phẩm phù hợp."
                : "Browse our premium paint catalog to find the right product."}
            </p>
            <div className="mt-fl-md">
              <Button asChild>
                <Link href="/products">
                  {language === "vi" ? "Xem sản phẩm" : "Shop products"}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-fl-lg grid grid-cols-1 items-start gap-fl-xl lg:grid-cols-12">

            {/* ── LEFT: Cart ledger ── */}
            <div className="lg:col-span-7">
              {/* Free shipping status line — text plus progress, never colour alone */}
              {amountNeededForFreeShipping > 0 ? (
                <div className="border-b border-atelier-rule pb-fl-sm text-fl-xs text-atelier-ink-2">
                  <div className="flex justify-between gap-fl-sm">
                    <span>
                      {language === "vi"
                        ? "Mua thêm để miễn phí giao hàng"
                        : "Add more for free shipping"}
                    </span>
                    <span className="font-medium tabular-nums text-atelier-ink">
                      {formatPrice(amountNeededForFreeShipping)}
                    </span>
                  </div>
                  <progress
                    value={progressToFreeShipping}
                    max={100}
                    aria-label={language === "vi" ? "Tiến độ miễn phí giao hàng" : "Free shipping progress"}
                    className="mt-fl-2xs h-1 w-full accent-atelier-accent"
                  />
                </div>
              ) : (
                <p className="border-b border-atelier-rule pb-fl-sm text-fl-xs font-medium text-atelier-success">
                  ✓ {language === "vi" ? "Bạn được miễn phí giao hàng." : "You qualify for free shipping."}
                </p>
              )}

              {/* Hairline ledger rows: image · name · colour · qty · price */}
              <ul>
                {items.map((item) => {
                  const itemSupplier = (item.paint as typeof item.paint & { supplier?: { name: string } }).supplier;
                  const discountedPrice = item.paint.discountPercent && item.paint.discountPercent > 0
                    ? item.paint.price * (1 - item.paint.discountPercent / 100)
                    : item.paint.price;

                  return (
                    <li key={item.id} className="border-b border-atelier-rule py-fl-sm">
                      <div className="flex gap-fl-sm">
                        {/* Product image */}
                        <Link
                          href={`/products/${item.paint.slug}`}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-surface border border-atelier-rule bg-atelier-paper-2 sm:h-20 sm:w-20"
                        >
                          <Image src={getProductImage(item.paint.images)} alt={item.paint.name} fill className="object-cover" />
                        </Link>

                        {/* Name · colour · controls */}
                        <div className="flex min-w-0 flex-1 flex-col gap-fl-2xs">
                          <div className="flex items-start justify-between gap-fl-2xs">
                            <div className="min-w-0">
                              <span className="fl-label block">
                                {itemSupplier?.name} · {item.paint.volume}{item.paint.volumeUnit}
                              </span>
                              <Link
                                href={`/products/${item.paint.slug}`}
                                className="mt-0.5 block truncate text-fl-sm font-medium text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:text-atelier-accent"
                              >
                                {language === "vi" ? item.paint.name : item.paint.nameEn}
                              </Link>
                              {item.selectedColor && (
                                <span className="mt-1 flex items-center gap-1.5">
                                  <ColorSwatch
                                    color={item.selectedColor.hex}
                                    className="h-3 w-3 shrink-0 border border-atelier-rule-strong"
                                  />
                                  <span className="truncate text-fl-xs text-atelier-ink-2">
                                    {language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn} ({item.selectedColor.code})
                                  </span>
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                removeItem(item.id);
                                toast.success(language === "vi" ? "Đã xóa sản phẩm." : "Removed item.");
                              }}
                              className="min-h-11 shrink-0 whitespace-nowrap text-fl-xs text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-danger md:min-h-6"
                            >
                              {language === "vi" ? "Xóa" : "Remove"}
                            </button>
                          </div>

                          {/* Price · qty stepper · line total */}
                          <div className="flex flex-wrap items-center justify-between gap-fl-sm">
                            <span className="shrink-0 text-fl-sm tabular-nums">
                              {item.paint.discountPercent && item.paint.discountPercent > 0 ? (
                                <span className="flex items-baseline gap-1.5">
                                  <span className="font-medium text-atelier-danger">{formatPrice(discountedPrice)}</span>
                                  <span className="text-fl-xs text-atelier-ink-3 line-through">{formatPrice(item.paint.price)}</span>
                                </span>
                              ) : (
                                <span className="font-medium">{formatPrice(item.paint.price)}</span>
                              )}
                            </span>

                            <span className="flex items-center gap-fl-sm">
                              <span className="flex items-center rounded-control border border-atelier-rule-strong">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  aria-label={t.appQtyDecrease}
                                  className="flex h-11 w-11 items-center justify-center text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 hover:text-atelier-ink md:h-9 md:w-9"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-8 text-center text-fl-sm font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  aria-label={t.appQtyIncrease}
                                  className="flex h-11 w-11 items-center justify-center text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 hover:text-atelier-ink md:h-9 md:w-9"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </span>
                              <span className="min-w-[72px] text-right text-fl-sm font-medium tabular-nums">
                                {formatPrice(discountedPrice * item.quantity)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Clear cart */}
              <div className="flex justify-end pt-fl-xs">
                <button
                  onClick={() => {
                    clearCart();
                    toast.success(language === "vi" ? "Giỏ hàng đã được xóa." : "Cart cleared.");
                  }}
                  className="min-h-11 whitespace-nowrap text-fl-xs text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-danger md:min-h-6"
                >
                  {language === "vi" ? "Xóa toàn bộ" : "Clear all"}
                </button>
              </div>
            </div>

            {/* ── RIGHT: Summary — recessed paper-2 surface ── */}
            <div className="lg:col-span-5">
              <div className="rounded-surface bg-atelier-paper-2 p-fl-md">
                <h2 className="fl-display text-fl-lg">
                  {language === "vi" ? "Tổng đơn hàng" : "Order summary"}
                </h2>

                {/* Coupon */}
                <div className="mt-fl-sm border-y border-atelier-rule py-fl-xs">
                  <button
                    onClick={() => setCouponOpen(!couponOpen)}
                    aria-expanded={couponOpen}
                    className="flex min-h-11 w-full items-center justify-between text-fl-sm font-medium text-atelier-ink md:min-h-6 md:py-1"
                  >
                    <span>
                      {appliedDiscount > 0
                        ? (language === "vi" ? `Mã đã áp dụng (−${formatPrice(appliedDiscount)})` : `Coupon applied (−${formatPrice(appliedDiscount)})`)
                        : (language === "vi" ? "Nhập mã giảm giá" : "Enter coupon code")}
                    </span>
                    <span aria-hidden="true" className="text-atelier-ink-3">{couponOpen ? "−" : "+"}</span>
                  </button>
                  {couponOpen && (
                    <div className="pt-fl-2xs">
                      <form onSubmit={handleApplyCoupon} className="flex gap-fl-2xs">
                        <Input
                          type="text"
                          placeholder={language === "vi" ? "FLOF10" : "FLOF10"}
                          aria-label={language === "vi" ? "Mã giảm giá" : "Coupon code"}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          aria-invalid={couponError ? true : undefined}
                          className="flex-1 bg-atelier-paper uppercase"
                        />
                        <Button type="submit" variant="outline">
                          {language === "vi" ? "Áp dụng" : "Apply"}
                        </Button>
                      </form>
                      {couponError && (
                        <p className="mt-fl-2xs text-fl-xs text-atelier-danger">{couponError}</p>
                      )}
                      <p className="mt-fl-2xs text-fl-xs text-atelier-ink-2">
                        {language === "vi" ? "Thử: FLOF10 hoặc JOTUN100" : "Try: FLOF10 or JOTUN100"}
                      </p>
                    </div>
                  )}
                </div>

                {/* SpecLedger-like total block */}
                <dl className="mt-fl-sm">
                  <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs">
                    <dt className="fl-label">{t.cartItemTotal}</dt>
                    <dd className="text-fl-sm tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs text-atelier-success">
                      <dt className="fl-label text-atelier-success">
                        {language === "vi" ? "Giảm giá" : "Discount"}
                      </dt>
                      <dd className="text-fl-sm tabular-nums">−{formatPrice(appliedDiscount)}</dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs">
                    <dt className="fl-label">{t.cartShipping}</dt>
                    <dd className="text-fl-sm tabular-nums">
                      {shippingFee === 0 ? (language === "vi" ? "Miễn phí" : "Free") : formatPrice(shippingFee)}
                    </dd>
                  </div>
                  <div className="flex items-end justify-between border-b border-atelier-rule-strong py-fl-xs">
                    <dt className="text-fl-sm font-medium">
                      {language === "vi" ? "Tổng cộng" : "Total"}
                    </dt>
                    <dd className="text-right">
                      <span className="block text-fl-xl font-medium tabular-nums">{formatPrice(total)}</span>
                      <span className="text-fl-xs text-atelier-ink-2">
                        {language === "vi" ? "Đã bao gồm VAT" : "VAT included"}
                      </span>
                    </dd>
                  </div>
                </dl>

                {/* Checkout CTA — hidden on mobile (shown in the fixed bottom bar) */}
                <Button
                  onClick={() => router.push(`/checkout?discount=${appliedDiscount}&coupon=${couponCode}`)}
                  className="mt-fl-md hidden w-full sm:inline-flex"
                >
                  {t.checkoutButton}
                </Button>

                {/* Authenticity note */}
                <p className="mt-fl-sm text-fl-xs leading-relaxed text-atelier-ink-2">
                  ✓ {language === "vi"
                    ? "Sản phẩm chính hãng từ nhà phân phối ủy quyền — đền bù 200% nếu phát hiện hàng giả."
                    : "100% genuine products from authorized distributors — 200% refund if counterfeit."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom checkout bar (mobile only) ── */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-fl-sm border-t border-atelier-rule-strong bg-atelier-paper px-[clamp(1rem,4vw,1.5rem)] py-fl-xs sm:hidden">
          <div className="min-w-0 flex-1">
            <p className="fl-label">{language === "vi" ? "Tổng cộng" : "Total"}</p>
            <p className="text-fl-lg font-medium leading-none tabular-nums">{formatPrice(total)}</p>
          </div>
          <Button
            onClick={() => router.push(`/checkout?discount=${appliedDiscount}&coupon=${couponCode}`)}
            className="shrink-0"
          >
            {language === "vi" ? "Thanh toán" : "Checkout"}
          </Button>
        </div>
      )}
    </div>
  );
}
