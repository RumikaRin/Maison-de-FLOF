import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { getUnpaidOrderTimeoutMinutes } from "@/lib/payment-policy";
import { expireUnpaidOnlineOrders } from "@/services/order-lifecycle.service";
import { writeOperationalLog } from "@/lib/operations/log";
import { jsonApiError } from "@/lib/api-error-contract";

/**
 * Cancels stale unpaid VNPay demo orders and restocks inventory.
 * Call periodically (e.g. every 5–15 minutes) with Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const startedAt = Date.now();
  const correlationId = request.headers.get("x-vercel-id") ?? undefined;
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) {
    writeOperationalLog("error", "cron.orders.unauthorized", {
      route: "/api/cron/expire-unpaid-orders",
      correlationId,
      durationMs: Date.now() - startedAt,
      errorCode: "UNAUTHORIZED",
    });
    return unauthorized;
  }

  try {
    const olderThanMinutes = getUnpaidOrderTimeoutMinutes();
    const result = await expireUnpaidOnlineOrders({
      olderThanMinutes,
      limit: 50,
    });
    writeOperationalLog("info", "cron.orders.completed", {
      route: "/api/cron/expire-unpaid-orders",
      correlationId,
      durationMs: Date.now() - startedAt,
      ...result,
    });
    return NextResponse.json({
      message: "Unpaid order expiry processed",
      olderThanMinutes,
      ...result,
    });
  } catch {
    writeOperationalLog("error", "cron.orders.failed", {
      route: "/api/cron/expire-unpaid-orders",
      correlationId,
      durationMs: Date.now() - startedAt,
      errorCode: "UNEXPECTED_ERROR",
    });
    return jsonApiError(
      request,
      500,
      "INTERNAL_ERROR",
      "Failed to expire unpaid orders",
    );
  }
}
