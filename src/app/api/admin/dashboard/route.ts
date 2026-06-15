import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse, requireStaff } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireStaff();
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);

    const [orders, revenueAggregate, completedOrdersCount, colorsCount, bestSellers, lowStockCount] = await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: since } },
        include: {
          customer: { include: { user: true } },
          items: { include: { paint: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { total: true },
      }),
      db.order.count({ where: { status: "COMPLETED" } }),
      db.paintColor.count(),
      db.paint.findMany({
        where: { isActive: true },
        orderBy: { soldCount: "desc" },
        take: 4,
      }),
      db.paint.count({ where: { isActive: true, stock: { lte: 5 } } }),
    ]);

    const completedOrders = orders.filter((order) => order.status === "COMPLETED");
    const totalRevenue = Number(revenueAggregate._sum.total || 0);
    const revenueByDate = new Map<string, number>();
    completedOrders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(order.total));
    });

    const dailyRevenue: number[] = [];
    const dailyLabels: string[] = [];
    for (let index = 29; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const key = date.toISOString().split("T")[0];
      dailyRevenue.push(revenueByDate.get(key) || 0);
      dailyLabels.push(
        `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      );
    }

    return NextResponse.json({
      stats: {
        totalRevenue,
        completedOrders: completedOrdersCount,
        colorsCount,
        lowStockCount,
      },
      recentOrders: orders.slice(0, 4).map((order) => ({
        id: order.orderNumber,
        date: order.createdAt.toISOString().split("T")[0],
        customer: order.customer.user.name || "Khách hàng",
        userEmail: order.customer.user.email,
        items: order.items.map((item) => `${item.productName || item.paint.name} x ${item.quantity}`).join("; "),
        total: Number(order.total),
        status: order.status,
      })),
      dailyRevenue,
      dailyLabels,
      bestSellers: bestSellers.map((paint) => ({
        id: paint.id,
        name: paint.name,
        nameEn: paint.nameEn || paint.name,
        sku: paint.sku,
        price: Number(paint.price),
        sales: paint.soldCount,
        revenue: paint.soldCount * Number(paint.price),
        stock: paint.stock,
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
