"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { Search, FileText, Printer, CheckCircle, Clock, XCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InvoiceModal } from "@/components/admin/InvoiceModal";

export default function AdminInvoicesPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");

  // Invoice modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải hóa đơn");
        setOrders(data);
      })
      .catch((error) => console.error(error))
      .finally(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  // Filters
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.userEmail && ord.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "COMPLETED" && ord.status === "COMPLETED") ||
      (statusFilter === "PENDING" && ord.status !== "COMPLETED" && ord.status !== "CANCELLED");

    return matchesSearch && matchesStatus;
  });

  const triggerViewInvoice = (order: any) => {
    setSelectedInvoiceOrder(order);
    setIsInvoiceModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-250/50 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {language === "vi" ? "Đã giao / Thanh toán" : "Delivered / Paid"}
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
          <span className="px-2 py-1 bg-jotun-yellow/10 text-amber-800 border border-jotun-yellow/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {language === "vi" ? "Chờ duyệt" : "Pending"}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <h1 className="text-3xl font-bold font-serif text-warm-900">
          {language === "vi" ? "Quản Lý Hóa Đơn Bán Hàng" : "Invoices Management"}
        </h1>
        <p className="text-warm-550 text-xs mt-1">
          {language === "vi"
            ? "Xem danh sách giao dịch, truy xuất hóa đơn bán lẻ/VAT và chuẩn bị tài liệu in ấn gửi khách hàng."
            : "Review sales transactions, generate retail/VAT invoices, and prepare printable receipts for customers."}
        </p>
      </motion.div>

      {/* Tabs and Search Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-warm-200 pb-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 self-start">
          {[
            { key: "ALL", label: language === "vi" ? "Tất cả giao dịch" : "All Sales" },
            { key: "COMPLETED", label: language === "vi" ? "Đã thanh toán" : "Paid Invoices" },
            { key: "PENDING", label: language === "vi" ? "Chưa thanh toán" : "Unpaid" }
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors duration-300 ${isActive
                  ? "text-white"
                  : "text-warm-650 hover:bg-warm-100 hover:text-warm-900"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeInvoiceFilterTab"
                    className="absolute inset-0 bg-warm-900 rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 600, damping: 42 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-warm-400" />
          <input
            type="text"
            placeholder={
              language === "vi" ? "Tìm theo mã đơn, tên khách hàng..." : "Search ID, customer name..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow font-semibold"
          />
        </div>
      </div>

      {/* Invoices List Table */}
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
                  <th className="pb-3 pr-4">{language === "vi" ? "Mã Hóa Đơn" : "Invoice No."}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Ngày Xuất" : "Issued Date"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Khách Hàng" : "Customer"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Chi Tiết Đơn Hàng" : "Description"}</th>
                  <th className="pb-3 px-4 text-right">{language === "vi" ? "Tổng Thanh Toán" : "Total Amount"}</th>
                  <th className="pb-3 px-4 text-center">{language === "vi" ? "Trạng Thái" : "Status"}</th>
                  <th className="pb-3 pl-4 text-right">{language === "vi" ? "Hành Động" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="py-4 pr-4 font-mono font-bold text-jotun-teal">{ord.id}</td>
                    <td className="py-4 px-4 font-mono text-warm-500">{ord.date}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-warm-900">{ord.customer || "Khách vãng lai"}</div>
                      {ord.userEmail && (
                        <div className="text-[10px] text-warm-550 font-mono font-semibold">{ord.userEmail}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 max-w-[220px] truncate leading-normal text-warm-650" title={ord.items}>
                      {ord.items}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-warm-900">
                      {formatPrice(ord.total)}
                    </td>
                    <td className="py-4 px-4 text-center">{getStatusBadge(ord.status)}</td>
                    <td className="py-4 pl-4 text-right">
                      <button
                        onClick={() => triggerViewInvoice(ord)}
                        className="text-[11px] font-bold text-white bg-jotun-teal hover:bg-jotun-teal-dark px-4 py-2 rounded-xl transition-all shadow-xs border border-jotun-teal cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{language === "vi" ? "Xuất Hóa Đơn" : "Export Invoice"}</span>
                      </button>
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
              {language === "vi" ? "Không tìm thấy hóa đơn giao dịch nào." : "No transaction invoices found."}
            </span>
          </div>
        )}
      </motion.div>

      {/* Invoice modal */}
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
