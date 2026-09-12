"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocaleNavigation } from "@/hooks/use-locale-navigation";
import { formatPrice } from "@/lib/utils";
import { safeMotion } from "@/components/ui/motion-safe";
import { ArrowRight, Boxes, MessageSquareQuote, PackagePlus, ShoppingBag } from "lucide-react";
import type {
  DashboardApiResponse,
  DashboardStat,
  DashboardRecentOrder,
  DashboardBestSeller,
} from "@/types/admin-dashboard";
import type { OrderStatus } from "@prisma/client";

const AdminRevenueChart = dynamic(
  () => import("@/components/admin/AdminRevenueChart").then((mod) => mod.AdminRevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-xl bg-warm-50 animate-pulse" />,
  },
);

/* ─── Status Badge (extracted, covers all OrderStatus values) ─── */

const STATUS_CONFIG: Record<OrderStatus, { vi: string; en: string; classes: string }> = {
  COMPLETED: { vi: "Đã giao", en: "Delivered", classes: "bg-emerald-50 text-emerald-700 border-emerald-250/50" },
  PROCESSING: { vi: "Đang xử lý", en: "Processing", classes: "bg-sky-50 text-sky-700 border-sky-200/50" },
  PENDING: { vi: "Chờ duyệt", en: "Pending", classes: "bg-jotun-yellow/10 text-amber-800 border-jotun-yellow/20" },
  CONFIRMED: { vi: "Đã xác nhận", en: "Confirmed", classes: "bg-blue-50 text-blue-700 border-blue-200/50" },
  SHIPPING: { vi: "Đang giao", en: "Shipping", classes: "bg-violet-50 text-violet-700 border-violet-200/50" },
  CANCELLED: { vi: "Đã hủy", en: "Cancelled", classes: "bg-rose-50 text-rose-700 border-rose-200/50" },
};

function StatusBadge({ status, language }: { status: OrderStatus; language: "vi" | "en" }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span className={`px-2 py-0.5 ${config.classes} text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit`}>
      {language === "vi" ? config.vi : config.en}
    </span>
  );
}

/* ─── Stat label helper (language computed at render-time, no refetch needed) ─── */

const STAT_LABELS: Record<DashboardStat["key"], { vi: string; en: string }> = {
  revenue: { vi: "Tổng doanh thu thực tế", en: "Total Actual Revenue" },
  completedOrders: { vi: "Đơn hàng thành công", en: "Completed Orders" },
  colorsCount: { vi: "Mã màu thiết kế", en: "Colors Available" },
  lowStock: { vi: "Sản phẩm sắp hết", en: "Low Stock Products" },
};

function statLabel(key: DashboardStat["key"], lang: "vi" | "en"): string {
  return STAT_LABELS[key]?.[lang] ?? key;
}

/* ─── Loading Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-hidden="true">
      <div>
        <div className="h-7 w-56 rounded-lg bg-warm-150" />
        <div className="h-3.5 w-80 rounded bg-warm-100 mt-2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="h-9 w-9 rounded-xl bg-warm-100" />
            <div className="h-4 w-24 rounded bg-warm-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="h-3.5 w-28 rounded bg-warm-100" />
            <div className="h-8 w-36 rounded bg-warm-100" />
            <div className="h-3 w-32 rounded bg-warm-100" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-warm-200/80 p-6 rounded-2xl">
        <div className="h-5 w-40 rounded bg-warm-100 mb-4" />
        <div className="h-[320px] w-full rounded-xl bg-warm-50" />
      </div>
    </div>
  );
}

/* ─── Error State ─── */

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 max-w-md">
        <p className="text-sm font-bold text-rose-700 mb-1">Không thể tải dữ liệu Dashboard</p>
        <p className="text-xs text-rose-600/80 mb-4">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-warm-950 px-4 py-2 text-xs font-bold text-white hover:bg-warm-850 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Page ─── */

export default function AdminDashboardPage() {
  const { language } = useLocaleNavigation();

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<DashboardRecentOrder[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [bestSellers, setBestSellers] = useState<DashboardBestSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetch("/api/admin/dashboard")
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || `HTTP ${response.status}`);
        }
        return response.json() as Promise<DashboardApiResponse>;
      })
      .then((data) => {
        setStats([
          { key: "revenue", label: "", value: data.stats.totalRevenue },
          { key: "completedOrders", label: "", value: data.stats.completedOrders },
          { key: "colorsCount", label: "", value: data.stats.colorsCount },
          { key: "lowStock", label: "", value: data.stats.lowStockCount },
        ]);
        setRecentOrders(data.recentOrders);
        setDailyRevenue(data.dailyRevenue);
        setDailyLabels(data.dailyLabels);
        setBestSellers(data.bestSellers);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải dashboard");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Set document title based on language (accessibility fix E4)
  useEffect(() => {
    document.title = language === "vi"
      ? "Bảng điều khiển — FLOF Admin"
      : "Dashboard — FLOF Admin";
  }, [language]);

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardError message={error} onRetry={fetchDashboard} />;

  return (
    <div className="flex flex-col gap-6 text-left fl-animate-slide-up">
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

      {/* Grid of stats — using stat.key as React key, labels computed at render */}
      <safeMotion.div
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <safeMotion.div
            key={stat.key}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-warm-450 font-semibold">{statLabel(stat.key, language)}</span>
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
        ))}
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
        <div className="h-[320px] w-full" role="img" aria-label={language === "vi" ? "Biểu đồ doanh thu 30 ngày" : "30-day revenue chart"}>
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
              <caption className="sr-only">
                {language === "vi" ? "Bảng đơn hàng gần đây" : "Recent orders table"}
              </caption>
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
                    <td className="py-3.5 pl-4"><StatusBadge status={ord.status} language={language} /></td>
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
            {bestSellers.map((prod) => (
              <div key={prod.id} className="flex justify-between items-center text-xs pb-3 border-b border-warm-100 last:border-0 last:pb-0">
                <div className="max-w-[65%]">
                  <h4 className="font-bold text-warm-850 truncate" title={language === "vi" ? prod.name : prod.nameEn}>
                    {language === "vi" ? prod.name : prod.nameEn}
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
