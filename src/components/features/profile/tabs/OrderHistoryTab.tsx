"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";

interface OrderHistoryTabProps {
  orders: any[];
  language: string;
}

export function OrderHistoryTab({ orders, language }: OrderHistoryTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
            {language === "vi" ? "Đã nhận hàng" : "Delivered"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
            {language === "vi" ? "Đang vận chuyển" : "Delivering"}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-500 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bezel-outer">
        <div className="bezel-inner p-4 sm:p-6 text-left shadow-sm">
          <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
            {language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}
          </h3>

          {orders.length > 0 ? (
            <div className="flex flex-col gap-5">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 border border-warm-200/80 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-warm-50/20 hover:bg-warm-50 hover:border-warm-350 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono text-jotun-teal text-sm">{ord.id}</span>
                      {getStatusBadge(ord.status)}
                    </div>
                    <p className="text-warm-800 mt-1.5 leading-relaxed font-semibold">
                      {typeof ord.items === "string"
                        ? ord.items
                        : Array.isArray(ord.items)
                          ? ord.items.map((i: any) => typeof i === "string" ? i : `${i.paint?.name || i.name || (language === "vi" ? "Sản phẩm" : "Paint")} x ${i.quantity || 1}`).join(", ")
                          : JSON.stringify(ord.items || "")}
                    </p>
                    <span className="text-[10px] text-warm-500 flex items-center gap-1 mt-1 font-mono">
                      {ord.date}
                    </span>
                  </div>

                  <div className="text-left sm:text-right font-mono shrink-0">
                    <span className="text-[10px] text-warm-500 block">
                      {language === "vi" ? "Tổng tiền" : "Total amount"}
                    </span>
                    <span className="font-bold text-base text-warm-900">
                      {formatPrice(ord.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 text-warm-500">
              {language === "vi" ? "Bạn chưa thực hiện đơn hàng nào." : "You have no orders yet."}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
