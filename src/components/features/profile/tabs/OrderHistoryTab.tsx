/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { useTrans } from "@/lib/dictionary";
import { Rule } from "@/components/ui/editorial";
import { toast } from "@/components/ui/csp-toast";
import type { ProfileOrder, ProfileOrderItem } from "../types";

interface OrderHistoryTabProps {
  orders: ProfileOrder[];
  language: string;
  onOrderCancelled?: () => void;
}

export function OrderHistoryTab({ orders, language, onOrderCancelled }: OrderHistoryTabProps) {
  const t = useTrans(language === "vi" ? "vi" : "en");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const statusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return language === "vi" ? "Đã nhận hàng" : "Delivered";
      case "PROCESSING":
        return language === "vi" ? "Đang vận chuyển" : "Delivering";
      case "CONFIRMED":
        return language === "vi" ? "Đã xác nhận" : "Confirmed";
      case "PENDING":
        return language === "vi" ? "Chờ xử lý" : "Pending";
      case "CANCELLED":
        return language === "vi" ? "Đã hủy" : "Cancelled";
      default:
        return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-atelier-success";
      case "PROCESSING":
      case "CONFIRMED":
        return "text-atelier-accent";
      case "CANCELLED":
        return "text-atelier-danger";
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

  const handleCancelOrder = async (orderNumber: string) => {
    const confirmMsg = language === "vi"
      ? `Bạn có chắc chắn muốn hủy đơn hàng ${orderNumber}?`
      : `Are you sure you want to cancel order ${orderNumber}?`;
    if (!window.confirm(confirmMsg)) return;

    setCancellingId(orderNumber);
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          reason: "Khách hàng tự hủy trên website",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(
          language === "vi"
            ? `Đã hủy đơn hàng ${orderNumber} thành công.`
            : `Order ${orderNumber} cancelled successfully.`,
        );
        onOrderCancelled?.();
      } else {
        toast.error(
          data.error?.message ||
            (language === "vi" ? "Không thể hủy đơn hàng" : "Could not cancel order"),
        );
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối" : "Network error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section>
      <h2 className="fl-display text-fl-xl">
        {language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}
      </h2>
      <Rule weight="strong" className="mt-fl-xs" />

      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
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
                <th scope="col" className="fl-label py-fl-2xs text-right font-medium">
                  {language === "vi" ? "Thao tác" : "Action"}
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
                  <td className="whitespace-nowrap py-fl-xs text-right text-fl-sm">
                    {ord.status === "PENDING" ? (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        disabled={cancellingId === ord.id}
                        className="text-xs font-medium text-atelier-danger hover:underline disabled:opacity-50"
                      >
                        {cancellingId === ord.id
                          ? (language === "vi" ? "Đang hủy..." : "Cancelling...")
                          : (language === "vi" ? "Hủy đơn" : "Cancel")}
                      </button>
                    ) : (
                      <span className="text-xs text-atelier-ink-2">—</span>
                    )}
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
