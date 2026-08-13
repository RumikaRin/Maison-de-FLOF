"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { safeMotion } from "@/components/ui/motion-safe";
import { ArrowRight, Boxes, MessageSquareQuote, PackagePlus, ShoppingBag } from "lucide-react";

const AdminRevenueChart = dynamic(
  () => import("@/components/admin/AdminRevenueChart").then((mod) => mod.AdminRevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-xl bg-warm-50 animate-pulse" />,
  },
);

export default function AdminDashboardPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    fetch("/api/admin/dashboard")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải dashboard");

        setStats([
          {
            label: language === "vi" ? "Tổng doanh thu thực tế" : "Total Actual Revenue",
            value: data.stats.totalRevenue,
            color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            change: "",
            isPositive: true,
          },
          {
            label: language === "vi" ? "Đơn hàng thành công" : "Completed Orders",
            value: data.stats.completedOrders,
            color: "bg-jotun-teal/10 text-jotun-teal border-jotun-teal/20",
            change: "",
            isPositive: true,
          },
          {
            label: language === "vi" ? "Mã màu thiết kế" : "Colors Available",
            value: data.stats.colorsCount,
            color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
            change: "",
            isPositive: true,
          },
          {
            label: language === "vi" ? "Sản phẩm sắp hết" : "Low Stock Products",
            value: data.stats.lowStockCount,
            color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
            change: "",
            isPositive: false,
          },
        ]);
        setRecentOrders(data.recentOrders);
        setDailyRevenue(data.dailyRevenue);
        setDailyLabels(data.dailyLabels);
        setBestSellers(
          data.bestSellers.map((paint: any) => ({
            ...paint,
            name: language === "vi" ? paint.name : paint.nameEn,
          })),
        );
      })
      .catch((error) => console.error(error));
  }, [language]);

  if (!mounted) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250/50 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Đã giao" : "Delivered"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/50 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Đang xử lý" : "Processing"}
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-0.5 bg-jotun-yellow/10 text-amber-800 border border-jotun-yellow/20 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Chờ duyệt" : "Pending"}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/50 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Đã hủy" : "Cancelled"}
          </span>
        );
      default:
        return null;
    }
  };

  // Variants for staggered entrance animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 25 
      } 
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title with subtle spring reveal */}
      <safeMotion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <h1 className="text-2xl font-bold text-warm-900">
          {language === "vi" ? "Tổng Quan Quản Trị" : "Dashboard Overview"}
        </h1>
        <p className="text-warm-550 text-xs mt-1">
          {language === "vi"
            ? "Theo dõi nhanh doanh số bán hàng, số liệu đơn hàng và các hoạt động báo giá dự án."
            : "Quick analytics monitoring of sales, order statistics, and project quotes."}
        </p>
      </safeMotion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/admin/orders", label: language === "vi" ? "Xử lý đơn hàng" : "Process orders", icon: ShoppingBag },
          { href: "/admin/import", label: language === "vi" ? "Nhập hàng vào kho" : "Import inventory", icon: PackagePlus },
          { href: "/admin/paints", label: language === "vi" ? "Quản lý sản phẩm" : "Manage products", icon: Boxes },
          { href: "/admin/quotes", label: language === "vi" ? "Xử lý báo giá" : "Manage quotes", icon: MessageSquareQuote },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-jotun-teal/30 hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-jotun-teal/10 text-jotun-teal">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-xs font-bold text-slate-800">{action.label}</span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-jotun-teal" />
            </Link>
          );
        })}
      </div>

      {/* Grid of stats with staggered spring-up and interactive scale on hover */}
      <safeMotion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat, index) => {
          return (
            <safeMotion.div
              variants={itemVariants}
              key={index}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-warm-450 font-semibold">{stat.label}</span>
                <span className="text-2xl font-bold font-mono text-warm-900">
                  {typeof stat.value === "number" && stat.value > 1000
                    ? formatPrice(stat.value)
                    : stat.value}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {language === "vi" ? "Cập nhật từ dữ liệu hệ thống" : "Live system data"}
                </span>
              </div>
            </safeMotion.div>
          );
        })}
      </safeMotion.div>

      {/* Main Stats Chart Row with slide-up reveal */}
      <safeMotion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 25 }}
        whileHover={{ boxShadow: "0 12px 30px -10px rgba(107, 95, 82, 0.05)" }}
        className="bg-white border border-warm-200/80 p-6 rounded-2xl shadow-sm flex flex-col gap-2 transition-shadow"
      >
        <h3 className="text-lg font-bold text-warm-900 font-serif">
          {language === "vi" ? "Doanh thu theo ngày" : "Daily Revenue"}
        </h3>
        <div className="h-[320px] w-full">
          <AdminRevenueChart language={language} dailyLabels={dailyLabels} dailyRevenue={dailyRevenue} />
        </div>
      </safeMotion.div>

      {/* Recent Orders and Best Selling Products Row */}
      <safeMotion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 25 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Recent Orders (Left) */}
        <div className="lg:col-span-7 bg-white border border-warm-200/80 rounded-2xl shadow-sm p-6 overflow-hidden hover:shadow-md transition-shadow">
          <h3 className="font-serif font-bold text-lg mb-4 text-warm-900">
            {language === "vi" ? "Đơn hàng gần đây" : "Recent Orders"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">{language === "vi" ? "Mã đơn hàng" : "Order ID"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Khách hàng" : "Customer"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Ngày mua" : "Purchase Date"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Tổng thanh toán" : "Total Amount"}</th>
                  <th className="pb-3 pl-4">{language === "vi" ? "Trạng thái" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 font-semibold">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-50/50 transition-colors duration-200">
                    <td className="py-3.5 pr-4 font-mono font-bold text-jotun-teal">{ord.id}</td>
                    <td className="py-3.5 px-4 text-warm-800">{ord.customer}</td>
                    <td className="py-3.5 px-4 font-mono text-warm-500">{ord.date}</td>
                    <td className="py-3.5 px-4 font-mono text-warm-900 font-bold">{formatPrice(ord.total)}</td>
                    <td className="py-3.5 pl-4">{getStatusBadge(ord.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Selling Products (Right) */}
        <div className="lg:col-span-5 bg-white border border-warm-200/80 rounded-2xl shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between border-b border-warm-100 pb-3">
            <h3 className="font-serif font-bold text-base text-warm-900">
              {language === "vi" ? "Sản phẩm bán chạy" : "Best Selling Products"}
            </h3>
            <Link href="/admin/paints" className="text-xs font-bold text-jotun-teal hover:underline cursor-pointer">
              {language === "vi" ? "Tất cả →" : "All →"}
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {bestSellers.map((prod, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-warm-100 last:border-0 last:pb-0">
                <div className="max-w-[65%]">
                  <h4 className="font-bold text-warm-850 truncate" title={prod.name}>
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-warm-550 mt-0.5 font-semibold">
                    SKU: <span className="font-mono text-[9px] font-bold">{prod.sku}</span> | {language === "vi" ? "Tồn: " : "Stock: "}{prod.stock}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-warm-900 block">
                    {prod.sales} {language === "vi" ? "đơn vị" : "units"}
                  </span>
                  <span className="text-[10px] text-jotun-teal font-semibold">
                    {formatPrice(prod.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </safeMotion.div>
    </div>
  );
}

