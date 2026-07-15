import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { getUnpaidOrderTimeoutMinutes } from "@/lib/payment-policy";
import { expireUnpaidOnlineOrders } from "@/services/order-lifecycle.service";

/**
 * Cancels stale unpaid VNPay demo orders and restocks inventory.
 * Call periodically (e.g. every 5–15 minutes) with Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    const olderThanMinutes = getUnpaidOrderTimeoutMinutes();
    const result = await expireUnpaidOnlineOrders({
      olderThanMinutes,
      limit: 50,
    });
    return NextResponse.json({
      message: "Unpaid order expiry processed",
      olderThanMinutes,
      ...result,
    });
  } catch (error) {
    console.error("Cron expire-unpaid-orders error:", error);
    return NextResponse.json({ error: "Failed to expire unpaid orders" }, { status: 500 });
  }
}
