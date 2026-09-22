import type { OrderStatus } from "@prisma/client";

/** Single KPI stat card on the dashboard */
export interface DashboardStat {
  label: string;
  value: number;
  /** Unique key for React rendering, avoids index-as-key */
  key: "revenue" | "completedOrders" | "colorsCount" | "lowStock";
}

/** A recent order row in the dashboard table */
export interface DashboardRecentOrder {
  id: string;
  date: string;
  customer: string;
  userEmail: string;
  items: string;
  total: number;
  status: OrderStatus;
}

/** A best-selling product in the dashboard sidebar */
export interface DashboardBestSeller {
  id: string;
  name: string;
  nameEn: string;
  sku: string;
  price: number;
  sales: number;
  revenue: number;
  stock: number;
}

/** Full API response from GET /api/admin/dashboard */
export interface DashboardApiResponse {
  stats: {
    totalRevenue: number;
    completedOrders: number;
    colorsCount: number;
    lowStockCount: number;
  };
  recentOrders: DashboardRecentOrder[];
  dailyRevenue: number[];
  dailyLabels: string[];
  bestSellers: DashboardBestSeller[];
}
