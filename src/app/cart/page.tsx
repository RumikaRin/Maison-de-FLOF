"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import { toast } from "sonner";

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
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in VND
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50000;
  const total = Math.max(0, subtotal + shippingFee - appliedDiscount);

  // Free shipping progress
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");

    if (!couponCode.trim()) return;

    if (couponCode.toUpperCase() === "FLOF10") {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount(discount);
      toast.success(
        language === "vi"
          ? "Áp dụng mã giảm giá 10% thành công!"
          : "Successfully applied 10% coupon!"
      );
    } else if (couponCode.toUpperCase() === "JOTUN100") {
      if (subtotal < 1000000) {
        setCouponError(
          language === "vi"
            ? "Mã JOTUN100 chỉ áp dụng cho đơn hàng từ 1.000.000đ trở lên."
            : "JOTUN100 only applies to orders of 1,000,000đ or more."
        );
        return;
      }
      setAppliedDiscount(100000);
      toast.success(
        language === "vi"
          ? "Áp dụng mã giảm giá 100.000đ thành công!"
          : "Successfully applied 100,000đ coupon!"
      );
    } else {
      setCouponError(
        language === "vi" ? "Mã giảm giá không hợp lệ." : "Invalid coupon code."
      );
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-screen pt-32 pb-24 text-left">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`${items.length === 0 ? "text-center" : "text-left"} mb-10`}
        >
          <h1 className={`${items.length === 0 ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"} font-serif font-extrabold text-warm-900 uppercase`}>
            {language === "vi" ? "Giỏ Hàng Của Bạn" : "Your Shopping Cart"}
          </h1>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="bezel-outer max-w-xl mx-auto"
          >
            <div className="bezel-inner p-16 text-center flex flex-col items-center gap-6">
              <div className="p-3 bg-warm-50/50 rounded-full border border-warm-200 text-warm-400 font-mono text-[10px] uppercase tracking-widest">
                [ {language === "vi" ? "Trống" : "Empty"} ]
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif mb-2 text-warm-900">{t.cartEmpty}</h2>
                <p className="text-xs sm:text-sm text-warm-550 leading-relaxed font-light">
                  {language === "vi"
                    ? "Duyệt qua danh mục sắc màu phong phú của FLOF để lựa chọn những sản phẩm tốt nhất cho không gian sống của bạn."
                    : "Browse through FLOF's rich color catalog and select the best products for your living space."}
                </p>
              </div>
              <Link
                href="/products"
                className="btn-island bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-8 py-3.5 shadow-sm"
              >
                <span>{language === "vi" ? "Mua sắm ngay" : "Shop Now"}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">→</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Cart Items List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="lg:col-span-8 flex flex-col gap-6"
            >
              {/* List */}
              <div className="bezel-outer">
                <div className="bezel-inner overflow-hidden flex flex-col shadow-sm">
                  <div className="divide-y divide-warm-100">
                    {items.map((item, idx) => {
                      const itemSupplier = MOCK_SUPPLIERS.find((s) => s.id === item.paint.supplierId);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.25 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                          className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-warm-50/20 transition-colors"
                        >
                          {/* Image & Title */}
                          <div className="flex gap-4 items-center flex-grow text-left">
                            <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-warm-100 bg-warm-50 shrink-0">
                              <Image src={item.paint.images?.[0] || "/product_interior.png"} alt={item.paint.name} fill className="object-cover" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-warm-400 uppercase tracking-wider font-mono">
                                {itemSupplier?.name} | {item.paint.volume} {item.paint.volumeUnit}
                              </span>
                              <h3 className="font-bold text-sm leading-snug hover:text-jotun-teal transition-colors text-warm-900 mt-0.5">
                                <Link href={`/products/${item.paint.slug}`}>
                                  {language === "vi" ? item.paint.name : item.paint.nameEn}
                                </Link>
                              </h3>
                              {item.selectedColor && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <div
                                    className="h-3 w-3 rounded border border-black/10"
                                    style={{ backgroundColor: item.selectedColor.hex }}
                                  />
                                  <span className="text-xs font-semibold text-warm-500">
                                    {language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn} ({item.selectedColor.code})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Pricing, Quantity, and Remove */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                            {/* Price column */}
                            <div className="text-left sm:text-right font-mono shrink-0">
                              <span className="text-xs text-warm-400 block sm:hidden">
                                {language === "vi" ? "Đơn giá" : "Price"}
                              </span>
                              {item.paint.discountPercent && item.paint.discountPercent > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-red-500">
                                    {formatPrice(item.paint.price * (1 - item.paint.discountPercent / 100))}
                                  </span>
                                  <span className="text-[10px] text-warm-400 line-through">
                                    {formatPrice(item.paint.price)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold text-warm-900">
                                  {formatPrice(item.paint.price)}
                                </span>
                              )}
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center border border-warm-200 rounded-xl bg-white shadow-xs overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-2.5 py-1.5 text-warm-400 hover:text-warm-900 transition-colors font-bold text-sm"
                              >
                                -
                              </button>
                              <span className="px-3 font-semibold font-mono text-sm min-w-8 text-center text-warm-850">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2.5 py-1.5 text-warm-400 hover:text-warm-900 transition-colors font-bold text-sm"
                              >
                                +
                              </button>
                            </div>

                            {/* Row Total */}
                            <div className="text-right font-mono font-bold text-sm text-jotun-teal min-w-[90px] hidden sm:block">
                              {item.paint.discountPercent && item.paint.discountPercent > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-red-500">
                                    {formatPrice(item.paint.price * (1 - item.paint.discountPercent / 100) * item.quantity)}
                                  </span>
                                  <span className="text-[10px] text-warm-400 font-normal line-through">
                                    {formatPrice(item.paint.price * item.quantity)}
                                  </span>
                                </div>
                              ) : (
                                <span>{formatPrice(item.paint.price * item.quantity)}</span>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => {
                                removeItem(item.id);
                                toast.success(
                                  language === "vi"
                                    ? "Đã xóa sản phẩm khỏi giỏ hàng."
                                    : "Removed item from cart."
                                );
                              }}
                              className="text-xs font-bold text-red-500 hover:underline px-2 py-1"
                              title={language === "vi" ? "Xóa" : "Remove"}
                            >
                              [Xóa]
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="bg-warm-50/20 p-4 border-t border-warm-100 flex justify-between items-center">
                    <button
                      onClick={() => {
                        clearCart();
                        toast.success(
                          language === "vi" ? "Giỏ hàng đã được xóa sạch." : "Cart cleared successfully."
                        );
                      }}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      {language === "vi" ? "Xóa sạch giỏ hàng" : "Clear whole cart"}
                    </button>
                    <Link href="/products" className="text-xs font-bold text-jotun-teal hover:underline font-serif">
                      {language === "vi" ? "+ Tiếp tục mua hàng" : "+ Continue Shopping"}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cart Totals & Coupon Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="lg:col-span-4 flex flex-col gap-6"
            >
              {/* Coupon Code Block */}
              <div className="bezel-outer">
                <div className="bezel-inner p-6 flex flex-col gap-4 text-left shadow-sm">
                  <h3 className="font-bold mb-1 text-xs text-warm-900 uppercase tracking-wider">
                    {language === "vi" ? "Mã giảm giá" : "Coupon Discount"}
                  </h3>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === "vi" ? "Nhập mã..." : "Coupon code..."}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-grow px-3 py-2.5 border border-warm-200 bg-white rounded-xl text-xs font-bold uppercase focus:outline-hidden focus:border-jotun-teal text-warm-850"
                    />
                    <button
                      type="submit"
                      className="bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      {language === "vi" ? "Áp dụng" : "Apply"}
                    </button>
                  </form>
                  {couponError && <p className="text-red-500 text-[10px] mt-1 font-semibold">{couponError}</p>}
                </div>
              </div>

              {/* Price Calculations */}
              <div className="bezel-outer">
                <div className="bezel-inner p-6 flex flex-col gap-4 text-left shadow-sm">
                  <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 text-[#88734C]">
                    {language === "vi" ? "Cộng giỏ hàng" : "Cart Totals"}
                  </h3>

                  <div className="flex flex-col gap-3 font-semibold text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-500">{t.cartItemTotal}</span>
                      <span className="font-mono text-warm-900">{formatPrice(subtotal)}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>{language === "vi" ? "Giảm giá" : "Discount"}</span>
                        <span className="font-mono">-{formatPrice(appliedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-warm-500">{t.cartShipping}</span>
                      <span className="font-mono text-warm-900">
                        {shippingFee === 0
                          ? language === "vi"
                            ? "Miễn phí"
                            : "Free"
                          : formatPrice(shippingFee)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-warm-100 pt-4 flex justify-between items-end">
                    <span className="font-serif font-bold text-base text-warm-900">{language === "vi" ? "Tổng thanh toán" : "Total payment"}</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-jotun-teal font-mono block">
                        {formatPrice(total)}
                      </span>
                      <span className="text-[10px] text-warm-450">
                        ({language === "vi" ? "Đã bao gồm VAT" : "VAT Included"})
                      </span>
                    </div>
                  </div>

                  {/* Trust block */}
                  <div className="bg-warm-50 p-3 rounded-xl border border-warm-100 flex flex-col gap-1 text-[10px] text-warm-500 leading-normal">
                    <strong className="text-warm-900 font-bold block mb-0.5">✓ Cam kết an tâm mua sắm:</strong>
                    Sản phẩm giao từ nhà phân phối chính thức, đền bù 200% nếu phát hiện hàng giả, hàng nhái.
                  </div>

                  {/* Checkout CTA */}
                  <button
                    onClick={() => router.push(`/checkout?discount=${appliedDiscount}&coupon=${couponCode}`)}
                    className="btn-island w-full py-4 justify-center bg-[#88734C] hover:bg-[#72603f] text-white text-xs font-bold shadow-sm"
                  >
                    <span>{t.checkoutButton}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
