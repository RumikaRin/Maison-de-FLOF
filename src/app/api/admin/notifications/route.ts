import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { parsePagination } from "@/lib/pagination";
import { buildNotificationEtag } from "@/lib/notifications/polling";
import type { NotificationType, Prisma } from "@prisma/client";

const NOTIFICATION_TYPES = new Set<NotificationType>([
  "ORDER",
  "STOCK",
  "QUOTE",
  "REVIEW",
  "SYSTEM",
]);

export async function GET(request: Request) {
  try {
    const actor = await requireStaff();
    const { searchParams } = new URL(request.url);
    const { limit } = parsePagination(searchParams, { defaultLimit: 50 });
    const type = searchParams.get("type") || "ALL";

    const whereClause: Prisma.NotificationWhereInput = { userId: actor.id };
    if (type !== "ALL") {
      if (!NOTIFICATION_TYPES.has(type as NotificationType)) {
        throw new ApiError(400, "Invalid notification type");
      }
      whereClause.type = type as NotificationType;
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({
        where: { userId: actor.id, isRead: false },
      }),
    ]);
    const etag = buildNotificationEtag({
      latestCreatedAt: notifications[0]?.createdAt ?? null,
      visibleCount: notifications.length,
      unreadCount,
      filter: `${type}:${limit}`,
    });
    const headers = {
      "Cache-Control": "private, no-store",
      ETag: etag,
    };

    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers });
    }

    return Response.json({ notifications, unreadCount }, { headers });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
