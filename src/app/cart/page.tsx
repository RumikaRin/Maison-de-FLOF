"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, Minus, Plus, Trash2, Tag, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";

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
        throw new Error(data.error || "Invalid coupon");
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
    <div className="relative w-full bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-screen pt-24 pb-32 md:pb-24 text-left">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">

        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-warm-700 hover:text-warm-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "vi" ? "Tiếp tục mua hàng" : "Continue Shopping"}</span>
            <span className="sm:hidden">{language === "vi" ? "Mua thêm" : "Shop"}</span>
          </Link>
          <h1 className="text-lg sm:text-2xl font-serif font-bold text-warm-900">
            {language === "vi" ? "Giỏ hàng" : "Cart"}
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-warm-500">({getCartItemCount()})</span>
            )}
          </h1>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center py-20 gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-warm-100 border border-warm-200 flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-warm-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif mb-2 text-warm-900">{t.cartEmpty}</h2>
              <p className="text-sm text-warm-500 leading-relaxed max-w-xs mx-auto font-light">
                {language === "vi"
                  ? "Duyệt danh mục sơn nước cao cấp để lựa chọn sản phẩm phù hợp."
                  : "Browse our premium paint catalog to find the right product."}
              </p>
            </div>
            <Link
              href="/products"
              className="btn-island bg-warm-900 hover:bg-warm-800 text-white text-sm font-bold px-8 py-3.5 shadow-sm"
            >
              <span>{language === "vi" ? "Mua sắm ngay" : "Shop Now"}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">→</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* ── LEFT: Cart Items ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 flex flex-col gap-3"
            >
              {/* Free shipping progress bar */}
              {amountNeededForFreeShipping > 0 ? (
                <div className="bg-white border border-warm-200 rounded-2xl px-4 py-3 text-xs text-warm-700">
                  <div className="flex justify-between mb-1.5">
                    <span>{language === "vi" ? "🚚 Mua thêm để miễn phí giao hàng" : "🚚 Add more for free shipping"}</span>
                    <span className="font-bold text-[#88734C]">{formatPrice(amountNeededForFreeShipping)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-warm-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#88734C] rounded-full transition-all duration-500"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs text-emerald-700 font-semibold">
                  ✓ {language === "vi" ? "Bạn được miễn phí giao hàng!" : "You qualify for free shipping!"}
                </div>
              )}

              {/* Item list */}
              <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden">
                <AnimatePresence>
                  {items.map((item, idx) => {
                    const itemSupplier = (item.paint as typeof item.paint & { supplier?: { name: string } }).supplier;
                    const discountedPrice = item.paint.discountPercent && item.paint.discountPercent > 0
                      ? item.paint.price * (1 - item.paint.discountPercent / 100)
                      : item.paint.price;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`p-4 sm:p-5 ${idx !== items.length - 1 ? "border-b border-warm-100" : ""}`}
                      >
                        <div className="flex gap-3 sm:gap-4">
                          {/* Product image */}
                          <Link href={`/products/${item.paint.slug}`} className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-warm-100 bg-warm-50 shrink-0">
                            <Image src={item.paint.images?.[0] || "/product_interior.webp"} alt={item.paint.name} fill className="object-cover" />
                          </Link>

                          {/* Product info + controls */}
                          <div className="flex flex-col gap-2 flex-1 min-w-0">
                            {/* Top: name + remove */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[9px] font-bold text-warm-400 uppercase tracking-wider font-mono block">
                                  {itemSupplier?.name} · {item.paint.volume}{item.paint.volumeUnit}
                                </span>
                                <Link href={`/products/${item.paint.slug}`} className="font-bold text-sm text-warm-900 hover:text-jotun-teal transition-colors line-clamp-1 mt-0.5 block">
                                  {language === "vi" ? item.paint.name : item.paint.nameEn}
                                </Link>
                                {item.selectedColor && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <div
                                      className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                                      style={{ backgroundColor: item.selectedColor.hex }}
                                    />
                                    <span className="text-[10px] font-medium text-warm-500 truncate">
                                      {language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn} ({item.selectedColor.code})
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  removeItem(item.id);
                                  toast.success(language === "vi" ? "Đã xóa sản phẩm." : "Removed item.");
                                }}
                                className="p-1.5 text-warm-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                title={language === "vi" ? "Xóa" : "Remove"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Bottom: price + quantity */}
                            <div className="flex items-center justify-between gap-3">
                              {/* Price */}
                              <div className="font-mono shrink-0">
                                {item.paint.discountPercent && item.paint.discountPercent > 0 ? (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-red-500">{formatPrice(discountedPrice)}</span>
                                    <span className="text-[9px] text-warm-400 line-through">{formatPrice(item.paint.price)}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-warm-900">{formatPrice(item.paint.price)}</span>
                                )}
                              </div>

                              {/* Quantity + subtotal */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center border border-warm-200 rounded-xl bg-warm-50 overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-900 hover:bg-warm-100 transition-all"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2 font-bold font-mono text-sm min-w-6 text-center text-warm-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-900 hover:bg-warm-100 transition-all"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="font-mono font-bold text-sm text-warm-900 min-w-[72px] text-right">
                                  {formatPrice(discountedPrice * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Clear cart */}
                <div className="px-4 sm:px-5 py-3 border-t border-warm-100 bg-warm-50/40 flex justify-end">
                  <button
                    onClick={() => {
                      clearCart();
                      toast.success(language === "vi" ? "Giỏ hàng đã được xóa." : "Cart cleared.");
                    }}
                    className="text-[11px] font-bold text-warm-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {language === "vi" ? "Xóa toàn bộ" : "Clear all"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── RIGHT: Summary & Coupon ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="lg:col-span-5 flex flex-col gap-4"
            >
              {/* Coupon - collapsible on mobile */}
              <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setCouponOpen(!couponOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold text-warm-900"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#88734C]" />
                    {appliedDiscount > 0
                      ? (language === "vi" ? `Mã đã áp dụng (-${formatPrice(appliedDiscount)})` : `Coupon applied (-${formatPrice(appliedDiscount)})`)
                      : (language === "vi" ? "Nhập mã giảm giá" : "Enter coupon code")}
                  </span>
                  {couponOpen ? <ChevronUp className="h-4 w-4 text-warm-400" /> : <ChevronDown className="h-4 w-4 text-warm-400" />}
                </button>
                <AnimatePresence>
                  {couponOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-warm-100">
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder={language === "vi" ? "Mã giảm giá..." : "Coupon code..."}
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-grow px-3 py-2.5 border border-warm-200 bg-warm-50 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-[#88734C] text-warm-850"
                          />
                          <button
                            type="submit"
                            className="bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                          >
                            {language === "vi" ? "Áp dụng" : "Apply"}
                          </button>
                        </form>
                        {couponError && <p className="text-red-500 text-[10px] mt-2 font-semibold">{couponError}</p>}
                        <p className="text-[10px] text-warm-400 mt-2">{language === "vi" ? "Thử: FLOF10 hoặc JOTUN100" : "Try: FLOF10 or JOTUN100"}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Order summary */}
              <div className="bg-white border border-warm-200 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="font-serif font-bold text-base text-warm-900 border-b border-warm-100 pb-3">
                  {language === "vi" ? "Tổng đơn hàng" : "Order Summary"}
                </h3>

                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-500">{t.cartItemTotal}</span>
                    <span className="font-mono font-semibold text-warm-900">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>{language === "vi" ? "Giảm giá" : "Discount"}</span>
                      <span className="font-mono">-{formatPrice(appliedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-warm-500">{t.cartShipping}</span>
                    <span className={`font-mono font-semibold ${shippingFee === 0 ? "text-green-600" : "text-warm-900"}`}>
                      {shippingFee === 0 ? (language === "vi" ? "Miễn phí" : "Free") : formatPrice(shippingFee)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-warm-100 pt-3 flex justify-between items-end">
                  <span className="font-serif font-bold text-base text-warm-900">{language === "vi" ? "Tổng cộng" : "Total"}</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-warm-900 font-mono block">{formatPrice(total)}</span>
                    <span className="text-[10px] text-warm-400">{language === "vi" ? "Đã bao gồm VAT" : "VAT included"}</span>
                  </div>
                </div>

                {/* Checkout CTA - hidden on mobile (shown in sticky bar) */}
                <button
                  onClick={() => router.push(`/checkout?discount=${appliedDiscount}&coupon=${couponCode}`)}
                  className="hidden sm:flex btn-island w-full py-4 justify-center bg-[#88734C] hover:bg-[#72603f] text-white text-sm font-bold shadow-sm"
                >
                  <span>{t.checkoutButton}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">→</span>
                </button>

                {/* Trust badge */}
                <div className="bg-warm-50 px-3 py-2.5 rounded-xl border border-warm-100 text-[10px] text-warm-500 leading-relaxed">
                  ✓ {language === "vi"
                    ? "Sản phẩm chính hãng từ nhà phân phối ủy quyền — đền bù 200% nếu phát hiện hàng giả."
                    : "100% genuine products from authorized distributors — 200% refund if counterfeit."}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom checkout bar (mobile only) ── */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-warm-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-warm-400 font-semibold">{language === "vi" ? "Tổng cộng" : "Total"}</p>
            <p className="text-lg font-bold font-mono text-warm-900 leading-none">{formatPrice(total)}</p>
          </div>
          <button
            onClick={() => router.push(`/checkout?discount=${appliedDiscount}&coupon=${couponCode}`)}
            className="btn-island bg-[#88734C] hover:bg-[#72603f] text-white text-sm font-bold px-6 py-3.5 shadow-sm flex-shrink-0"
          >
            <span>{language === "vi" ? "Thanh toán" : "Checkout"}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
