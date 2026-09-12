import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse, requireStaff } from "@/lib/api-auth";
import type { OrderStatus } from "@prisma/client";
import type { DashboardApiResponse, DashboardBestSeller } from "@/types/admin-dashboard";

/** Statuses that represent confirmed revenue (paid or fulfilled orders) */
const REVENUE_STATUSES: OrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPING", "COMPLETED"];

/** Convert a Date to YYYY-MM-DD string in Vietnam timezone (UTC+7) */
function toVNDateKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export async function GET() {
  try {
    await requireStaff();
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);

    const [
      recentOrders,
      chartOrders,
      revenueAggregate,
      completedOrdersCount,
      colorsCount,
      bestSellerRevenue,
      lowStockCount,
    ] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          orderNumber: true,
          createdAt: true,
          total: true,
          status: true,
          customer: { select: { user: { select: { name: true, email: true } } } },
          items: {
            select: {
              quantity: true,
              productName: true,
              paint: { select: { name: true } },
            },
          },
        },
      }),
      db.order.findMany({
        where: { createdAt: { gte: since }, status: { in: REVENUE_STATUSES } },
        select: { createdAt: true, total: true },
      }),
      db.order.aggregate({
        where: { status: { in: REVENUE_STATUSES } },
        _sum: { total: true },
      }),
      db.order.count({ where: { status: { in: REVENUE_STATUSES } } }),
      db.paintColor.count(),
      // Actual revenue per paint from OrderItem totals (not fake soldCount * currentPrice)
      db.$queryRaw<{ paintId: string; actualRevenue: bigint }[]>`
        SELECT oi."paintId", SUM(oi."total")::bigint AS "actualRevenue"
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        WHERE o.status IN ('CONFIRMED','PROCESSING','SHIPPING','COMPLETED')
        GROUP BY oi."paintId"
        ORDER BY "actualRevenue" DESC
        LIMIT 4
      `,
      db.paint.count({ where: { isActive: true, stock: { lte: 5 } } }),
    ]);

    // Lookup paint details for best sellers
    const topPaintIds = bestSellerRevenue.map((r) => r.paintId);
    const topPaints =
      topPaintIds.length > 0
        ? await db.paint.findMany({ where: { id: { in: topPaintIds } } })
        : [];
    const paintMap = new Map(topPaints.map((p) => [p.id, p]));

    const totalRevenue = Number(revenueAggregate._sum.total || 0);

    // Group chart revenue by VN timezone date
    const revenueByDate = new Map<string, number>();
    chartOrders.forEach((order) => {
      const date = toVNDateKey(order.createdAt);
      revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(order.total));
    });

    const dailyRevenue: number[] = [];
    const dailyLabels: string[] = [];
    for (let index = 29; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const key = toVNDateKey(date);
      dailyRevenue.push(revenueByDate.get(key) || 0);
      dailyLabels.push(
        date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }),
      );
    }

    // Build best sellers from actual revenue
    const bestSellers: DashboardBestSeller[] = bestSellerRevenue.map((row) => {
      const paint = paintMap.get(row.paintId);
      return {
        id: row.paintId,
        name: paint?.name ?? "N/A",
        nameEn: paint?.nameEn ?? paint?.name ?? "N/A",
        sku: paint?.sku ?? "",
        price: Number(paint?.price ?? 0),
        sales: paint?.soldCount ?? 0,
        revenue: Number(row.actualRevenue),
        stock: paint?.stock ?? 0,
      };
    });

    const body: DashboardApiResponse = {
      stats: {
        totalRevenue,
        completedOrders: completedOrdersCount,
        colorsCount,
        lowStockCount,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.orderNumber,
        date: toVNDateKey(order.createdAt),
        customer: order.customer.user.name || "Khách hàng",
        userEmail: order.customer.user.email,
        items: order.items
          .map((item) => `${item.productName || item.paint.name} x ${item.quantity}`)
          .join("; "),
        total: Number(order.total),
        status: order.status,
      })),
      dailyRevenue,
      dailyLabels,
      bestSellers,
    };

    return NextResponse.json(body);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
