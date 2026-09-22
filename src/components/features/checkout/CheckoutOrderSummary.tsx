/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useMemo } from "react";
import { CspImage as Image } from "@/components/ui/csp-image";
import { getProductImage } from "@/lib/product-image";
import { cn, formatPrice } from "@/lib/utils";
import { calculateCarrierQuotes } from "@/lib/logistics-calculator";

interface CheckoutOrderSummaryProps {
  language: string;
  items: any[];
  subtotal: number;
  discountParam: number;
  shippingFee: number;
  total: number;
  province?: string;
}

function OrderSummaryBody({
  language,
  items,
  subtotal,
  discountParam,
  shippingFee,
  total,
  province = "",
  className,
}: CheckoutOrderSummaryProps & { className?: string }) {
  const carrierQuotes = useMemo(
    () => calculateCarrierQuotes(items, province),
    [items, province],
  );
  return (
    <div className={cn("rounded-surface bg-atelier-paper-2 p-fl-md text-atelier-ink", className)}>
      <ul className="max-h-[300px] overflow-y-auto border-t border-atelier-rule">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-fl-sm border-b border-atelier-rule py-fl-2xs"
          >
            <div className="flex min-w-0 items-center gap-fl-2xs">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-surface border border-atelier-rule bg-atelier-paper">
                <Image
                  src={getProductImage(item.paint.images)}
                  alt={item.paint.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-fl-sm font-medium">
                  {language === "vi" ? item.paint.name : item.paint.nameEn}
                </p>
                <p className="truncate text-fl-xs text-atelier-ink-2">
                  {item.paint.volume} {item.paint.volumeUnit}
                  {item.selectedColor
                    ? ` | ${item.selectedColor.code} - ${language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right tabular-nums">
              <span className="block text-fl-xs text-atelier-ink-2">×{item.quantity}</span>
              <span className="block text-fl-sm font-medium">
                {formatPrice(
                  (item.paint.discountPercent && item.paint.discountPercent > 0
                    ? item.paint.price * (1 - item.paint.discountPercent / 100)
                    : item.paint.price) * item.quantity,
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-fl-sm">
        <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs">
          <dt className="fl-label">{language === "vi" ? "Tạm tính" : "Subtotal"}</dt>
          <dd className="text-fl-sm tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        {discountParam > 0 ? (
          <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs text-atelier-success">
            <dt className="fl-label text-atelier-success">
              {language === "vi" ? "Giảm giá" : "Discount"}
            </dt>
            <dd className="text-fl-sm tabular-nums">−{formatPrice(discountParam)}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between border-b border-atelier-rule py-fl-2xs">
          <dt className="fl-label">{language === "vi" ? "Phí vận chuyển" : "Shipping Fee"}</dt>
          <dd className="text-fl-sm tabular-nums">
            {shippingFee === 0 ? (language === "vi" ? "Miễn phí" : "Free") : formatPrice(shippingFee)}
          </dd>
        </div>
        <div className="flex items-end justify-between border-b border-atelier-rule-strong py-fl-xs">
          <dt className="text-fl-sm font-medium">
            {language === "vi" ? "Tổng cộng" : "Grand Total"}
          </dt>
          <dd className="text-fl-xl font-medium tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>

      {items.length > 0 && (
        <div className="mt-fl-sm rounded-surface border border-atelier-rule bg-atelier-paper p-fl-xs text-fl-xs">
          <div className="mb-fl-2xs flex items-center justify-between font-medium text-atelier-ink">
            <span>
              {language === "vi"
                ? "Cước đối tác vận chuyển tham khảo"
                : "Courier reference estimates"}
            </span>
            <span className="text-[11px] text-atelier-ink-2">
              ~{carrierQuotes.totalWeightKg} kg
            </span>
          </div>
          <div className="space-y-1">
            {carrierQuotes.quotes.map((q) => (
              <div
                key={q.carrierId}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="font-medium text-atelier-ink">
                  {q.shortName}{" "}
                  <span className="font-normal text-atelier-ink-2">
                    ({q.estimatedDays})
                  </span>
                </span>
                <span className="tabular-nums font-medium text-atelier-ink">
                  {formatPrice(q.estimatedFee)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-fl-2xs text-[10px] text-atelier-ink-2">
            {language === "vi"
              ? "* FLOF hỗ trợ Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000đ."
              : "* Free nationwide shipping applied for orders over 500,000 VND."}
          </p>
        </div>
      )}
    </div>
  );
}

export function CheckoutOrderSummary(props: CheckoutOrderSummaryProps) {
  const { language } = props;

  return (
    <>
      <details className="border-y border-atelier-rule py-fl-sm lg:hidden">
        <summary
          role="button"
          className="flex min-h-11 cursor-pointer list-none items-center justify-between text-fl-sm font-medium marker:content-none"
        >
          <span>{language === "vi" ? "Đơn hàng của bạn" : "Your order"}</span>
          <span className="text-atelier-accent">{language === "vi" ? "Xem" : "View"}</span>
        </summary>
        <OrderSummaryBody {...props} className="mt-fl-sm" />
      </details>

      <aside className="hidden lg:sticky lg:top-24 lg:col-span-5 lg:block">
        <div className="mb-fl-sm fl-display text-fl-lg">
          {language === "vi" ? "Đơn hàng của bạn" : "Your order"}
        </div>
        <OrderSummaryBody {...props} />
      </aside>
    </>
  );
}
