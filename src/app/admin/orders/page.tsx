"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { Trash2, CheckCircle, Clock, XCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { InvoiceModal } from "@/components/admin/InvoiceModal";

export default function AdminOrdersPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED">("ALL");
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
    setMounted(true);
    const storedOrders = localStorage.getItem("sonvn-orders");
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (e) {
        setOrders([]);
      }
    } else {
      const initialMock = [
        { id: "SVN-839201", date: "2026-06-04", userEmail: "customer1@sonvn.com", customer: "Trần Thế Hưng", items: "Jotun Majestic 5L x 2, Trắng Ngà (1001)", total: 2850000, status: "COMPLETED" },
        { id: "SVN-193021", date: "2026-05-18", userEmail: "customer1@sonvn.com", customer: "Lê Hoàng Yến", items: "Dulux Weathershield 5L x 1, Xám Bạc (3002)", total: 1280000, status: "PROCESSING" },
        { id: "SVN-482019", date: "2026-06-03", userEmail: "customer2@sonvn.com", customer: "Nguyễn Minh Đức", total: 950000, items: "Sơn lót chống kiềm Majestic 5L x 1", status: "PENDING" }
      ];
      localStorage.setItem("sonvn-orders", JSON.stringify(initialMock));
      setOrders(initialMock);
    }
  }, []);

  if (!mounted) return null;

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const updated = orders.map((ord) => {
      if (ord.id === id) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    setOrders(updated);
    localStorage.setItem("sonvn-orders", JSON.stringify(updated));
    toast.success(
      language === "vi"
        ? `Đã cập nhật trạng thái đơn hàng thành ${newStatus}!`
        : `Order status updated to ${newStatus}!`
    );
  };

  const triggerDeleteOrder = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const updated = orders.filter((ord) => ord.id !== orderToDelete);
    setOrders(updated);
    localStorage.setItem("sonvn-orders", JSON.stringify(updated));
    toast.success(
      language === "vi" ? "Đã xóa đơn hàng thành công!" : "Order deleted successfully!"
    );
    setOrderToDelete(null);
  };

  const filteredOrders = orders.filter((ord) => {
    if (filter === "ALL") return true;
    return ord.status === filter;
  });

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
        <h1 className="text-3xl font-bold font-serif text-warm-900">
          {language === "vi" ? "Quản Lý Đơn Hàng" : "Orders Management"}
        </h1>
        <p className="text-warm-550 text-xs mt-1">
          {language === "vi"
            ? "Xem danh sách các đơn hàng, lọc theo trạng thái và cập nhật thông tin tiến độ giao nhận."
            : "Review client order list, filter by states, and update shipping progress info."}
        </p>
      </motion.div>

      {/* Tabs filter with smooth slider bg indicator */}
      <div className="flex flex-wrap gap-2 border-b border-warm-200 pb-4">
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
              className={`relative px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors duration-300 ${isActive
                ? "text-white"
                : "text-warm-650 hover:bg-warm-100 hover:text-warm-900"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterTab"
                  className="absolute inset-0 bg-warm-900 rounded-xl z-0"
                  transition={{ type: "spring", stiffness: 600, damping: 42 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table block with list item animations */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden p-6"
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
                    <td className="py-4 px-4 font-mono font-bold text-warm-900">{formatPrice(ord.total)}</td>
                    <td className="py-4 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-4 px-4 text-center min-w-[120px]">
                      <CustomSelect
                        value={ord.status}
                        onValueChange={(val) => handleUpdateStatus(ord.id, val)}
                        className="!h-8 !py-1 !px-2.5 !text-[11px]"
                        options={[
                          { value: "PENDING", label: language === "vi" ? "Chờ duyệt" : "Pending" },
                          { value: "PROCESSING", label: language === "vi" ? "Đang giao" : "Delivering" },
                          { value: "COMPLETED", label: language === "vi" ? "Hoàn thành" : "Completed" },
                          { value: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" },
                        ]}
                      />
                    </td>
                    <td className="py-4 pl-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => triggerViewInvoice(ord)}
                          className="text-[11px] font-bold text-white bg-jotun-teal hover:bg-jotun-teal-dark px-3 py-1.5 rounded-xl transition-all shadow-xs border border-jotun-teal cursor-pointer"
                          title={language === "vi" ? "Xuất hóa đơn" : "Export Invoice"}
                        >
                          {language === "vi" ? "Hóa đơn" : "Invoice"}
                        </button>
                        <button
                          onClick={() => triggerDeleteOrder(ord.id)}
                          className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer"
                          title={language === "vi" ? "Xóa đơn" : "Delete Order"}
                        >
                          {language === "vi" ? "Xóa" : "Delete"}
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
        title={language === "vi" ? "Xóa đơn hàng?" : "Delete Order?"}
        message={
          language === "vi"
            ? `Bạn có chắc muốn xóa đơn hàng ${orderToDelete} không?`
            : `Are you sure you want to delete order ${orderToDelete}?`
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

