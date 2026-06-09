"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Printer, X, Check, FileText } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    date: string;
    customer: string;
    userEmail?: string;
    items: string;
    total: number;
    status: string;
    paymentMethod?: string;
  } | null;
}

interface ParsedItem {
  name: string;
  quantity: number;
  color: string;
  price: number;
  total: number;
}

export function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const { language } = useLanguageStore();
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

  useEffect(() => {
    if (!order) return;

    // Parse items description string e.g. "Jotun Majestic 5L x 2, Trắng Ngà (1001); Dulux..."
    const itemsList = order.items.split(";");
    const parsed = itemsList.map((itemStr) => {
      const trimmed = itemStr.trim();
      const xParts = trimmed.split(" x ");
      if (xParts.length < 2) {
        return {
          name: trimmed,
          quantity: 1,
          color: "—",
          price: order.total, // fallback
          total: order.total,
        };
      }

      const name = xParts[0].trim();
      const commaParts = xParts[1].split(",");
      const quantity = parseInt(commaParts[0].trim()) || 1;
      const color = commaParts.slice(1).join(",").trim() || "—";

      // Look up price in localStorage sonvn-paints
      let price = 850000; // fallback
      try {
        const storedPaints = localStorage.getItem("sonvn-paints");
        if (storedPaints) {
          const paints = JSON.parse(storedPaints);
          const found = paints.find(
            (p: any) =>
              name.toLowerCase().includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(name.toLowerCase())
          );
          if (found) {
            price = found.price * (1 - (found.discountPercent || 0) / 100);
          }
        }
      } catch (e) {}

      return {
        name,
        quantity,
        color,
        price,
        total: price * quantity,
      };
    });

    setParsedItems(parsed);
  }, [order]);

  if (!isOpen || !order) return null;

  // Invoice calculations
  const computedSubtotal = parsedItems.reduce((sum, item) => sum + item.total, 0);
  const shippingFee = computedSubtotal >= 500000 ? 0 : 50000;
  const orderTotal = order.total;
  // Calculate discount dynamically to match total
  const discount = Math.max(0, computedSubtotal + shippingFee - orderTotal);

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return language === "vi" ? "ĐÃ THANH TOÁN" : "PAID";
      case "CANCELLED":
        return language === "vi" ? "ĐÃ HỦY ĐƠN" : "CANCELLED";
      default:
        return language === "vi" ? "CHỜ THANH TOÁN" : "PENDING";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-8 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Print Style Injector */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Wrapper */}
      <div 
        id="print-invoice-area"
        className="bg-white text-warm-900 border border-warm-250 w-full max-w-3xl rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col gap-6 relative print:border-none print:shadow-none print:max-w-full"
      >
        {/* Close Button - hidden during print */}
        <button
          onClick={onClose}
          className="no-print absolute top-5 right-5 p-2 text-warm-400 hover:text-warm-900 hover:bg-warm-100 rounded-full transition-colors cursor-pointer"
          title={language === "vi" ? "Đóng" : "Close"}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-warm-200 pb-5 gap-4">
          <div className="text-left">
            <h1 className="font-serif font-extrabold text-2xl tracking-tight text-warm-900 flex items-center gap-2">
              <span className="text-jotun-teal font-sans">FLOF</span>
              <span className="text-xs uppercase tracking-widest text-warm-400 font-sans border-l border-warm-300 pl-2 mt-1">
                {language === "vi" ? "Đại lý Ủy quyền" : "Authorized Dealer"}
              </span>
            </h1>
            <p className="text-[10px] text-warm-500 font-semibold mt-1 font-mono uppercase">
              Maison de FLOF Paint Store
            </p>
            <p className="text-[11px] text-warm-550 leading-relaxed font-medium mt-0.5">
              18 Đường Sơn, Quận Cầu Giấy, Hà Nội<br />
              MST: 0109283741 | Hotline: 1900-FLOF
            </p>
          </div>

          <div className="text-left md:text-right flex flex-col md:items-end">
            <h2 className="text-lg font-serif font-bold text-warm-900 uppercase">
              {language === "vi" ? "HÓA ĐƠN BÁN HÀNG" : "SALES INVOICE"}
            </h2>
            <p className="text-xs font-mono font-bold text-jotun-teal mt-0.5">
              No: {order.id}
            </p>
            <p className="text-[11px] text-warm-500 font-mono mt-1">
              {language === "vi" ? "Ngày lập" : "Date"}: {order.date}
            </p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border mt-2 block w-fit ${
              order.status === "COMPLETED" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Customer & Transaction Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-xs border-b border-warm-150 pb-5">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-bold text-warm-400 uppercase tracking-wider text-[10px]">
              {language === "vi" ? "Khách hàng (Người mua)" : "Buyer Details"}
            </h3>
            <p className="font-bold text-warm-900 text-sm">{order.customer}</p>
            {order.userEmail && (
              <p className="font-mono text-warm-550">{order.userEmail}</p>
            )}
            <p className="text-warm-600 leading-relaxed">
              {language === "vi" ? "Địa chỉ nhận hàng" : "Address"}: {language === "vi" ? "Giao tận nơi theo đơn hàng" : "Delivery address on file"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 md:items-end md:text-right">
            <h3 className="font-bold text-warm-400 uppercase tracking-wider text-[10px]">
              {language === "vi" ? "Phương thức thanh toán" : "Payment Method"}
            </h3>
            <p className="font-bold text-warm-800">
              {order.paymentMethod || "COD (Thanh toán khi nhận hàng)"}
            </p>
            <div className="mt-2 p-3 bg-warm-50 border border-warm-200 rounded-xl max-w-xs text-[10px] text-warm-550 leading-relaxed text-left print:bg-white print:border-none">
              <span className="font-bold block text-warm-700 text-[9px] uppercase tracking-wider mb-0.5">
                {language === "vi" ? "Điều khoản thanh toán" : "Payment Terms"}
              </span>
              {language === "vi" 
                ? "Hóa đơn bán lẻ kiêm phiếu xuất kho. Vui lòng kiểm tra kỹ số lượng và màu sơn trước khi nhận." 
                : "Retail invoice & delivery slip. Please double-check quantities & paint colors upon receipt."}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-grow overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-200 text-warm-450 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 pr-4">#</th>
                <th className="py-2.5 px-4">{language === "vi" ? "Tên Sản Phẩm" : "Paint Item"}</th>
                <th className="py-2.5 px-4">{language === "vi" ? "Mã Màu" : "Color Code"}</th>
                <th className="py-2.5 px-4 text-center">{language === "vi" ? "SL" : "Qty"}</th>
                <th className="py-2.5 px-4 text-right">{language === "vi" ? "Đơn Giá" : "Unit Price"}</th>
                <th className="py-2.5 pl-4 text-right">{language === "vi" ? "Thành Tiền" : "Total"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
              {parsedItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 pr-4 font-mono font-bold text-warm-400">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-warm-900 block">{item.name}</span>
                  </td>
                  <td className="py-3 px-4 text-warm-650 font-mono text-[11px]">{item.color}</td>
                  <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatPrice(item.price)}</td>
                  <td className="py-3 pl-4 text-right font-mono font-bold text-warm-900">
                    {formatPrice(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex justify-end border-t border-warm-200 pt-5">
          <div className="w-full max-w-sm flex flex-col gap-2 text-xs font-semibold text-warm-550">
            <div className="flex justify-between">
              <span>{language === "vi" ? "Cộng tiền hàng:" : "Subtotal:"}</span>
              <span className="font-mono text-warm-900">{formatPrice(computedSubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500 font-bold">
                <span>{language === "vi" ? "Chiết khấu/Giảm giá:" : "Discount:"}</span>
                <span className="font-mono">-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{language === "vi" ? "Phí vận chuyển:" : "Shipping Fee:"}</span>
              <span className="font-mono text-warm-900">
                {shippingFee === 0 ? (language === "vi" ? "Miễn phí" : "Free") : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-warm-150 pt-2 text-sm font-bold text-warm-900">
              <span>{language === "vi" ? "TỔNG THANH TOÁN:" : "TOTAL AMOUNT:"}</span>
              <span className="font-mono text-jotun-teal text-base">{formatPrice(orderTotal)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Signatures */}
        <div className="grid grid-cols-2 gap-6 text-center text-xs mt-12 pb-6">
          <div className="flex flex-col gap-12">
            <span className="font-bold text-warm-600 uppercase tracking-wide">
              {language === "vi" ? "Người mua hàng" : "Customer Signature"}
            </span>
            <span className="text-[10px] text-warm-400 font-light italic">
              {language === "vi" ? "(Ký và ghi rõ họ tên)" : "(Sign and write full name)"}
            </span>
          </div>
          <div className="flex flex-col gap-12 items-center">
            <span className="font-bold text-warm-600 uppercase tracking-wide">
              {language === "vi" ? "Đại diện cửa hàng" : "Authorized Seller"}
            </span>
            {order.status === "COMPLETED" ? (
              <div className="border-2 border-emerald-600 text-emerald-600 rounded px-2.5 py-1 text-[10px] font-extrabold uppercase font-mono tracking-widest rotate-[-6deg] w-fit shadow-xs">
                Maison de FLOF - PAID
              </div>
            ) : (
              <span className="text-[10px] text-warm-400 font-light italic">
                {language === "vi" ? "(Ký và đóng dấu)" : "(Sign and stamp)"}
              </span>
            )}
          </div>
        </div>

        {/* Modal Action Controls - hidden during print */}
        <div className="no-print flex items-center justify-end gap-3 border-t border-warm-150 pt-5 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-warm-250 hover:bg-warm-50 text-warm-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {language === "vi" ? "Đóng lại" : "Close"}
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-jotun-teal hover:bg-jotun-teal/90 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>{language === "vi" ? "In Hóa Đơn" : "Print Invoice"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
