"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { CheckCircle, Clock, Search, XCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { InvoiceModal } from "@/components/admin/InvoiceModal";

export default function AdminOrdersPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Invoice states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  const triggerViewInvoice = (order: any) => {
    setSelectedInvoiceOrder(order);
    setIsInvoiceModalOpen(true);
  };

  useEffect(() => {
    fetch("/api/orders")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải đơn hàng");
        setOrders(data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật đơn hàng");

      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status: data.status } : order,
        ),
      );
      toast.success(
        language === "vi"
          ? `Đã cập nhật trạng thái đơn hàng thành ${data.status}!`
          : `Order status updated to ${data.status}!`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật đơn hàng");
    }
  };

  const handleConfirmPayment = async (order: any) => {
    const transactionCode = window.prompt(
      language === "vi" ? "Nhập mã giao dịch ngân hàng:" : "Enter bank transaction code:",
    )?.trim();
    if (!transactionCode) return;
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: order.paymentId, transactionCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể xác nhận thanh toán");
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, paymentStatus: "PAID", status: data.orderStatus || item.status }
            : item,
        ),
      );
      toast.success(language === "vi" ? "Đã xác nhận thanh toán." : "Payment confirmed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xác nhận thanh toán");
    }
  };

  const handleRefundPayment = async (order: any) => {
    const refundCode = window.prompt(
      language === "vi" ? "Nhập mã giao dịch hoàn tiền:" : "Enter refund transaction code:",
    )?.trim();
    if (!refundCode) return;
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: order.paymentId,
          transactionCode: refundCode,
          action: "REFUND",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể ghi nhận hoàn tiền");
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, paymentStatus: "REFUNDED" } : item,
        ),
      );
      toast.success(language === "vi" ? "Đã ghi nhận hoàn tiền." : "Refund recorded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ghi nhận hoàn tiền");
    }
  };

  const triggerDeleteOrder = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    await handleUpdateStatus(orderToDelete, "CANCELLED");
    setOrderToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = filter === "ALL" || ord.status === filter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      ord.id?.toLowerCase().includes(query) ||
      ord.customer?.toLowerCase().includes(query) ||
      ord.userEmail?.toLowerCase().includes(query) ||
      ord.items?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusCount = (status: string) =>
    status === "ALL" ? orders.length : orders.filter((order) => order.status === status).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-250/50 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {language === "vi" ? "Đã nhận hàng" : "Delivered"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200/50 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {language === "vi" ? "Đang vận chuyển" : "Delivering"}
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 bg-jotun-yellow/10 text-amber-800 border border-jotun-yellow/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {language === "vi" ? "Chờ duyệt" : "Pending"}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200/50 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {language === "vi" ? "Đã hủy" : "Cancelled"}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-zinc-500/10 text-zinc-550 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title with spring entry */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <h1 className="text-2xl font-bold text-warm-900">
          {language === "vi" ? "Quản Lý Đơn Hàng" : "Orders Management"}
        </h1>
        <p className="text-warm-550 text-xs mt-1">
          {language === "vi"
            ? "Xem danh sách các đơn hàng, lọc theo trạng thái và cập nhật thông tin tiến độ giao nhận."
            : "Review client order list, filter by states, and update shipping progress info."}
        </p>
      </motion.div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[minmax(260px,1fr)_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={language === "vi" ? "Tìm mã đơn, khách hàng, email hoặc sản phẩm..." : "Search order, customer, email or product..."}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none focus:border-jotun-teal focus:bg-white"
          />
        </label>

        {/* Status filters */}
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 no-scrollbar">
        {[
          { key: "ALL", label: language === "vi" ? "Tất cả" : "All" },
          { key: "PENDING", label: language === "vi" ? "Chờ duyệt" : "Pending" },
          { key: "PROCESSING", label: language === "vi" ? "Đang giao" : "Delivering" },
          { key: "COMPLETED", label: language === "vi" ? "Hoàn thành" : "Completed" },
          { key: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" }
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] ${isActive ? "bg-jotun-teal/10 text-jotun-teal" : "bg-slate-200 text-slate-500"}`}>
                {statusCount(tab.key)}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Table block with list item animations */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 md:p-5"
      >
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto min-h-[320px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">{language === "vi" ? "Mã đơn" : "Order ID"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Ngày" : "Date"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Khách hàng" : "Customer"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Chi tiết sản phẩm" : "Products info"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Tổng tiền" : "Total"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="pb-3 px-4 text-center">{language === "vi" ? "Đổi trạng thái" : "Change Status"}</th>
                  <th className="pb-3 pl-4 text-center">{language === "vi" ? "Hành động" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="py-4 pr-4 font-mono font-bold text-jotun-teal">{ord.id}</td>
                    <td className="py-4 px-4 font-mono text-warm-500">{ord.date}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-warm-900">{ord.customer || "Khách vãng lai"}</div>
                      <div className="text-[10px] text-warm-550 font-mono font-semibold">{ord.userEmail || "Khách vãng lai"}</div>
                    </td>
                    <td className="py-4 px-4 max-w-[200px] truncate leading-normal" title={ord.items}>{ord.items}</td>
                    <td className="py-4 px-4 font-mono font-bold text-warm-900">
                      {formatPrice(ord.total)}
                      <div className={`mt-1 text-[9px] ${ord.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                        {ord.paymentMethod}: {ord.paymentStatus || "PENDING"}
                      </div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-4 px-4 text-center min-w-[120px]">
                      <CustomSelect
                        value={ord.status}
                        onValueChange={(val) => handleUpdateStatus(ord.id, val)}
                        className="!h-8 !py-1 !px-2.5 !text-[11px]"
                        options={[
                          { value: "PENDING", label: language === "vi" ? "Chờ duyệt" : "Pending" },
                          { value: "CONFIRMED", label: language === "vi" ? "Đã xác nhận" : "Confirmed" },
                          { value: "PROCESSING", label: language === "vi" ? "Đang giao" : "Delivering" },
                          { value: "SHIPPING", label: language === "vi" ? "Đang vận chuyển" : "Shipping" },
                          { value: "COMPLETED", label: language === "vi" ? "Hoàn thành" : "Completed" },
                          { value: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" },
                        ]}
                      />
                    </td>
                    <td className="py-4 pl-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {ord.paymentMethod === "TRANSFER" && ord.paymentStatus === "PENDING" && (
                          <button
                            onClick={() => handleConfirmPayment(ord)}
                            className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs border border-emerald-600 cursor-pointer"
                          >
                            {language === "vi" ? "Đối soát" : "Confirm payment"}
                          </button>
                        )}
                        {ord.paymentMethod === "TRANSFER" && ord.paymentStatus === "PAID" && ord.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleRefundPayment(ord)}
                            className="text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl transition-all shadow-xs border border-amber-600 cursor-pointer"
                          >
                            {language === "vi" ? "Hoàn tiền" : "Refund"}
                          </button>
                        )}
                        <button
                          onClick={() => triggerViewInvoice(ord)}
                          className="text-[11px] font-bold text-white bg-jotun-teal hover:bg-jotun-teal-dark px-3 py-1.5 rounded-xl transition-all shadow-xs border border-jotun-teal cursor-pointer"
                          title={language === "vi" ? "Xuất hóa đơn" : "Export Invoice"}
                        >
                          {language === "vi" ? "Hóa đơn" : "Invoice"}
                        </button>
                        <button
                          onClick={() => triggerDeleteOrder(ord.id)}
                          disabled={ord.status === "CANCELLED" || ord.status === "COMPLETED"}
                          className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer"
                          title={language === "vi" ? "Hủy đơn" : "Cancel Order"}
                        >
                          {language === "vi" ? "Hủy" : "Cancel"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-12 flex flex-col items-center gap-3">
            <ShieldAlert className="h-10 w-10 text-warm-400" />
            <span className="text-warm-500 text-xs font-semibold">
              {language === "vi" ? "Không tìm thấy đơn hàng nào." : "No orders found."}
            </span>
          </div>
        )}
      </motion.div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        title={language === "vi" ? "Hủy đơn hàng?" : "Cancel Order?"}
        message={
          language === "vi"
            ? `Bạn có chắc muốn hủy đơn hàng ${orderToDelete}? Hàng tồn sẽ được hoàn lại.`
            : `Cancel order ${orderToDelete}? Reserved stock will be restored.`
        }
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoiceOrder(null);
        }}
        order={selectedInvoiceOrder}
      />
    </div>
  );
}
