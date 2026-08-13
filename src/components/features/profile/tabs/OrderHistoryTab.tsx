/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { formatPrice } from "@/lib/utils";
import { useTrans } from "@/lib/dictionary";
import { Rule } from "@/components/ui/editorial";
import type { ProfileOrder, ProfileOrderItem } from "../types";

interface OrderHistoryTabProps {
  orders: ProfileOrder[];
  language: string;
}

export function OrderHistoryTab({ orders, language }: OrderHistoryTabProps) {
  const t = useTrans(language === "vi" ? "vi" : "en");

  const statusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return language === "vi" ? "Đã nhận hàng" : "Delivered";
      case "PROCESSING":
        return language === "vi" ? "Đang vận chuyển" : "Delivering";
      default:
        return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-atelier-success";
      case "PROCESSING":
        return "text-atelier-accent";
      default:
        return "text-atelier-ink-2";
    }
  };

  const itemsText = (ord: ProfileOrder) =>
    typeof ord.items === "string"
      ? ord.items
      : Array.isArray(ord.items)
        ? ord.items.map((i: string | ProfileOrderItem) => typeof i === "string" ? i : `${i.paint?.name || i.name || (language === "vi" ? "Sản phẩm" : "Paint")} x ${i.quantity || 1}`).join(", ")
        : JSON.stringify(ord.items || "");

  return (
    <section>
      <h2 className="fl-display text-fl-xl">
        {language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}
      </h2>
      <Rule weight="strong" className="mt-fl-xs" />

      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-atelier-rule">
                <th scope="col" className="fl-label py-fl-2xs pr-fl-sm font-medium">
                  {t.appOrderColOrder}
                </th>
                <th scope="col" className="fl-label py-fl-2xs pr-fl-sm font-medium">
                  {t.appOrderColItems}
                </th>
                <th scope="col" className="fl-label py-fl-2xs pr-fl-sm font-medium">
                  {t.appOrderColDate}
                </th>
                <th scope="col" className="fl-label py-fl-2xs pr-fl-sm font-medium">
                  {t.appOrderColStatus}
                </th>
                <th scope="col" className="fl-label py-fl-2xs text-right font-medium">
                  {t.appOrderColTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id} className="border-b border-atelier-rule align-top">
                  <td className="whitespace-nowrap py-fl-xs pr-fl-sm text-fl-sm font-medium tabular-nums">
                    {ord.id}
                  </td>
                  <td className="min-w-[14rem] py-fl-xs pr-fl-sm text-fl-sm leading-relaxed text-atelier-ink-2">
                    {itemsText(ord)}
                  </td>
                  <td className="whitespace-nowrap py-fl-xs pr-fl-sm text-fl-sm tabular-nums text-atelier-ink-2">
                    {ord.date}
                  </td>
                  <td className={`whitespace-nowrap py-fl-xs pr-fl-sm text-fl-sm font-medium ${statusColor(ord.status)}`}>
                    {statusText(ord.status)}
                  </td>
                  <td className="whitespace-nowrap py-fl-xs text-right text-fl-sm font-medium tabular-nums">
                    {formatPrice(ord.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-fl-lg text-fl-sm text-atelier-ink-2">
          {language === "vi" ? "Bạn chưa thực hiện đơn hàng nào." : "You have no orders yet."}
        </p>
      )}
    </section>
  );
}
