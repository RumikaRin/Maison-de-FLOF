/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";

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
    <aside className="lg:sticky lg:top-24 lg:col-span-5">
      <div className="rounded-surface bg-atelier-paper-2 p-fl-md text-atelier-ink">
        <h2 className="fl-display text-fl-lg">
          {language === "vi" ? "Đơn hàng của bạn" : "Your order"}
        </h2>

        {/* Hairline item rows */}
        <ul className="mt-fl-sm max-h-[300px] overflow-y-auto border-t border-atelier-rule">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-fl-sm border-b border-atelier-rule py-fl-2xs"
            >
              <div className="flex min-w-0 items-center gap-fl-2xs">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-surface border border-atelier-rule bg-atelier-paper">
                  <Image src={getProductImage(item.paint.images)} alt={item.paint.name} fill sizes="40px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-fl-sm font-medium">
                    {language === "vi" ? item.paint.name : item.paint.nameEn}
                  </p>
                  <p className="truncate text-fl-xs text-atelier-ink-2">
                    {item.paint.volume} {item.paint.volumeUnit}
                    {item.selectedColor ? ` | ${item.selectedColor.code} - ${language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn}` : ""}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <span className="block text-fl-xs text-atelier-ink-2">×{item.quantity}</span>
                <span className="block text-fl-sm font-medium">
                  {formatPrice(
                    (item.paint.discountPercent && item.paint.discountPercent > 0
                      ? item.paint.price * (1 - item.paint.discountPercent / 100)
                      : item.paint.price) * item.quantity
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* SpecLedger-like totals */}
        <dl className="mt-fl-sm">
          <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs">
            <dt className="fl-label">{language === "vi" ? "Tạm tính" : "Subtotal"}</dt>
            <dd className="text-fl-sm tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          {discountParam > 0 && (
            <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs text-atelier-success">
              <dt className="fl-label text-atelier-success">
                {language === "vi" ? "Giảm giá" : "Discount"}
              </dt>
              <dd className="text-fl-sm tabular-nums">−{formatPrice(discountParam)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs">
            <dt className="fl-label">{language === "vi" ? "Phí vận chuyển" : "Shipping Fee"}</dt>
            <dd className="text-fl-sm tabular-nums">
              {shippingFee === 0
                ? language === "vi"
                  ? "Miễn phí"
                  : "Free"
                : formatPrice(shippingFee)}
            </dd>
          </div>
          <div className="flex items-end justify-between border-b border-atelier-rule-strong py-fl-xs">
            <dt className="text-fl-sm font-medium">
              {language === "vi" ? "Tổng cộng" : "Grand Total"}
            </dt>
            <dd className="text-fl-xl font-medium tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
