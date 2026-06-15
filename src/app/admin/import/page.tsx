"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, History, Package, AlertTriangle, Building, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomSelect } from "@/components/ui/custom-select";

interface InventoryPaint {
  id: string;
  sku: string;
  name: string;
  nameEn: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  volume: number;
  volumeUnit: string;
  supplier: string;
}

interface ImportTransaction {
  id: string;
  date: string;
  paintId: string;
  paintName: string;
  sku: string;
  quantity: number;
  importPrice: number;
  supplier: string;
  reason: string;
}

export default function AdminImportPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [paints, setPaints] = useState<InventoryPaint[]>([]);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);

  // Form states
  const [selectedPaintId, setSelectedPaintId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [importPrice, setImportPrice] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải dữ liệu kho");
        setPaints(data.paints);
        setTransactions(data.transactions);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setMounted(true));
  }, []);

  // Update form fields when paint is selected
  useEffect(() => {
    if (!selectedPaintId) return;
    const paint = paints.find(p => p.id === selectedPaintId);
    if (paint) {
      setImportPrice(paint.costPrice || Math.round(paint.price * 0.6));
      setSupplier(paint.supplier);
    }
  }, [selectedPaintId, paints]);

  if (!mounted) return null;

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPaintId) {
      toast.error(language === "vi" ? "Vui lòng chọn sản phẩm cần nhập." : "Please select a product to import.");
      return;
    }

    if (quantity <= 0) {
      toast.error(language === "vi" ? "Số lượng nhập phải lớn hơn 0." : "Quantity must be greater than 0.");
      return;
    }

    const selectedPaint = paints.find(p => p.id === selectedPaintId);
    if (!selectedPaint) return;

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paintId: selectedPaintId,
          quantity,
          costPrice: importPrice,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể nhập kho");

      setPaints((current) =>
        current.map((paint) => (paint.id === data.paint.id ? data.paint : paint)),
      );
      setTransactions((current) => [data.transaction, ...current]);
      toast.success(
        language === "vi"
          ? `Đã nhập thành công ${quantity} hộp sơn "${selectedPaint.name}"!`
          : `Successfully imported ${quantity} cans of "${selectedPaint.nameEn}"!`,
      );
      setSelectedPaintId("");
      setQuantity(10);
      setImportPrice(0);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể nhập kho");
    }
  };

  const lowStockPaints = paints.filter(p => p.stock <= p.minStock);
  const totalValueImported = transactions.reduce((sum, tx) => sum + (tx.quantity * tx.importPrice), 0);

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <h1 className="text-3xl font-bold font-serif text-warm-900">
          {language === "vi" ? "Nhập Hàng Vào Kho" : "Import Goods"}
        </h1>
        <p className="text-warm-550 text-xs mt-1">
          {language === "vi"
            ? "Tạo phiếu nhập kho, tăng lượng hàng tồn thực tế và thiết lập giá mua vốn cho sản phẩm sơn."
            : "Create import receipts, increase physical stock levels, and set cost prices for paint products."}
        </p>
      </motion.div>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-jotun-teal/10 text-jotun-teal rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Tổng tiền nhập hàng" : "Total Value Imported"}
            </span>
            <span className="text-lg font-bold font-mono text-warm-900 mt-0.5">
              {formatPrice(totalValueImported)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center">
            <History className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Tổng số phiếu nhập" : "Import Transactions"}
            </span>
            <span className="text-lg font-bold font-mono text-warm-900 mt-0.5">
              {transactions.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Sản phẩm sắp hết hàng" : "Low Stock Warnings"}
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 mt-0.5">
              {lowStockPaints.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Import Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-warm-200/80 p-6 rounded-2xl shadow-sm">
            <h3 className="font-serif font-bold text-lg text-warm-900 border-b border-warm-100 pb-3 flex items-center gap-2">
              <Plus className="h-5 w-5 text-jotun-teal" />
              {language === "vi" ? "Phiếu Nhập Hàng Mới" : "New Import Receipt"}
            </h3>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-4 mt-4 text-xs font-semibold text-warm-700">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                  {language === "vi" ? "Chọn sản phẩm sơn" : "Select Paint Product"} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={selectedPaintId}
                  onValueChange={setSelectedPaintId}
                  placeholder={language === "vi" ? "-- Chọn sản phẩm để nhập --" : "-- Select Paint Product --"}
                  options={paints.map((p) => ({
                    value: p.id,
                    label: `${language === "vi" ? p.name : p.nameEn} (${p.volume}${p.volumeUnit}) - Tồn kho: ${p.stock}`,
                  }))}
                />
              </div>

              {selectedPaintId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-warm-50/50 p-4 border border-warm-200 rounded-xl flex flex-col gap-2.5"
                >
                  <div className="flex justify-between">
                    <span className="text-warm-450">SKU:</span>
                    <span className="font-mono font-bold text-warm-900">
                      {paints.find(p => p.id === selectedPaintId)?.sku}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-450">{language === "vi" ? "Tồn kho hiện tại:" : "Current Stock:"}</span>
                    <span className="font-mono font-bold text-jotun-teal">
                      {paints.find(p => p.id === selectedPaintId)?.stock} hộp
                    </span>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                    {language === "vi" ? "Số lượng nhập" : "Import Quantity"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    className="px-3 py-2 rounded-xl border border-warm-200 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 text-left"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                    {language === "vi" ? "Đơn giá nhập (VND)" : "Unit Cost Price"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={importPrice}
                    onChange={(e) => setImportPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="px-3 py-2 rounded-xl border border-warm-200 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 text-left"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                  {language === "vi" ? "Nhà cung cấp" : "Supplier"} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Building className="absolute left-3 h-4 w-4 text-warm-400" />
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="E.g. Jotun Việt Nam"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-warm-450 tracking-wider">
                  {language === "vi" ? "Lý do / Ghi chú nhập" : "Import Reason / Notes"}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={language === "vi" ? "E.g. Nhập hàng định kỳ đầu tháng..." : "E.g. Monthly restocking..."}
                  className="px-3 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 resize-none"
                />
              </div>

              {selectedPaintId && (
                <div className="border-t border-warm-100 pt-3 flex justify-between items-center text-sm font-bold text-warm-900 mt-2">
                  <span>{language === "vi" ? "Tổng tiền tạm tính:" : "Estimated Total:"}</span>
                  <span className="font-mono text-jotun-teal text-base">
                    {formatPrice(quantity * importPrice)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-warm-900 hover:bg-warm-850 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <Plus className="h-4 w-4" />
                <span>{language === "vi" ? "XÁC NHẬN NHẬP HÀNG" : "CONFIRM IMPORT"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Table & Alerts */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Alerts: Low Stock */}
          {lowStockPaints.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                <span>
                  {language === "vi" 
                    ? `Cảnh báo: Có ${lowStockPaints.length} sản phẩm sắp hết hàng!` 
                    : `Low Stock Warning: ${lowStockPaints.length} items running out!`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockPaints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPaintId(p.id)}
                    className="bg-white border border-rose-200/80 text-rose-700 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                    title={language === "vi" ? "Nhấp để nhập sản phẩm này" : "Click to import this item"}
                  >
                    <span>{language === "vi" ? p.name : p.nameEn}</span>
                    <span className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded text-[8px] font-extrabold">
                      {p.stock} {language === "vi" ? "hộp" : "cans"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table: Import History */}
          <div className="bg-white border border-warm-200/80 p-6 rounded-2xl shadow-sm">
            <h3 className="font-serif font-bold text-lg text-warm-900 border-b border-warm-100 pb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-warm-500" />
              {language === "vi" ? "Lịch Sử Nhập Hàng Gần Đây" : "Import History Logs"}
            </h3>

            <div className="overflow-x-auto mt-4 max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[9px] bg-warm-50/50">
                    <th className="py-2.5 px-3">{language === "vi" ? "Mã phiếu" : "Receipt ID"}</th>
                    <th className="py-2.5 px-3">{language === "vi" ? "Thời gian" : "Time"}</th>
                    <th className="py-2.5 px-3">{language === "vi" ? "Sản phẩm (SKU)" : "Paint (SKU)"}</th>
                    <th className="py-2.5 px-3 text-center">{language === "vi" ? "SL" : "Qty"}</th>
                    <th className="py-2.5 px-3 text-right">{language === "vi" ? "Đơn giá" : "Cost"}</th>
                    <th className="py-2.5 px-3 text-right">{language === "vi" ? "Tổng tiền" : "Total"}</th>
                    <th className="py-2.5 px-3">{language === "vi" ? "Nhà cung cấp" : "Supplier"}</th>
                    <th className="py-2.5 px-3">{language === "vi" ? "Ghi chú" : "Reason"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 font-semibold text-warm-850">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-warm-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-jotun-teal">{tx.id}</td>
                      <td className="py-3 px-3 font-mono text-warm-500 text-[10px]">{tx.date}</td>
                      <td className="py-3 px-3 max-w-[150px] truncate" title={tx.paintName}>
                        <span className="font-bold text-warm-900 block truncate">{tx.paintName}</span>
                        <span className="text-[9px] text-warm-400 font-mono block">{tx.sku}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{tx.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-warm-700">{formatPrice(tx.importPrice)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-warm-900">
                        {formatPrice(tx.quantity * tx.importPrice)}
                      </td>
                      <td className="py-3 px-3 text-warm-700">{tx.supplier}</td>
                      <td className="py-3 px-3 font-medium text-warm-550 max-w-[120px] truncate" title={tx.reason}>
                        {tx.reason}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-warm-400 font-medium">
                        {language === "vi" ? "Chưa có giao dịch nhập hàng nào." : "No import transactions logged."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
