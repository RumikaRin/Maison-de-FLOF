import { db } from "@/lib/db";
import { apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const actor = await requireStaff();
    const { searchParams } = new URL(request.url);
    const { limit } = parsePagination(searchParams, { defaultLimit: 50 });
    const type = searchParams.get("type"); // optional filter

    const whereClause: any = { userId: actor.id };
    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: { userId: actor.id, isRead: false },
    });

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
