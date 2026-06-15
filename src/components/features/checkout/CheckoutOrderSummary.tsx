"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface CheckoutOrderSummaryProps {
  language: string;
  items: any[];
  subtotal: number;
  discountParam: number;
  shippingFee: number;
  total: number;
}

export function CheckoutOrderSummary({
  language,
  items,
  subtotal,
  discountParam,
  shippingFee,
  total,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border border-border p-6 rounded-xl shadow-sm flex flex-col gap-6">
      <h2 className="font-serif font-bold text-lg border-b border-border pb-3">
        {language === "vi" ? "Đơn hàng của bạn" : "Your Order"}
      </h2>

      {/* List of items inside sidebar */}
      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 items-center justify-between text-xs py-1 border-b border-zinc-50 dark:border-zinc-900 last:border-0">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 border border-border bg-zinc-50 rounded overflow-hidden shrink-0">
                <Image src={item.paint.images?.[0] || "/product_interior.png"} alt={item.paint.name} fill sizes="40px" className="object-cover" />
              </div>
              <div>
                <h4 className="font-bold line-clamp-1">
                  {language === "vi" ? item.paint.name : item.paint.nameEn}
                </h4>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  {item.paint.volume} {item.paint.volumeUnit}
                  {item.selectedColor ? ` | ${item.selectedColor.code} - ${language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right font-mono shrink-0">
              <span className="text-muted-foreground">x{item.quantity}</span>
              <span className="font-bold block text-jotun-teal">
                {formatPrice(
                  (item.paint.discountPercent && item.paint.discountPercent > 0
                    ? item.paint.price * (1 - item.paint.discountPercent / 100)
                    : item.paint.price) * item.quantity
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing calculations */}
      <div className="border-t border-border pt-4 flex flex-col gap-3 font-semibold text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>{language === "vi" ? "Tạm tính" : "Subtotal"}</span>
          <span className="font-mono text-foreground">{formatPrice(subtotal)}</span>
        </div>
        {discountParam > 0 && (
          <div className="flex justify-between text-red-500">
            <span>{language === "vi" ? "Giảm giá" : "Discount"}</span>
            <span className="font-mono">-{formatPrice(discountParam)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{language === "vi" ? "Phí vận chuyển" : "Shipping Fee"}</span>
          <span className="font-mono text-foreground">
            {shippingFee === 0
              ? language === "vi"
                ? "Miễn phí"
                : "Free"
              : formatPrice(shippingFee)}
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-4 flex justify-between items-end">
        <span className="font-serif font-bold text-sm">{language === "vi" ? "Tổng cộng" : "Grand Total"}</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-jotun-teal font-mono block">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
