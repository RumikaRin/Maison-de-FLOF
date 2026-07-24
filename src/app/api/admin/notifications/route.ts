import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }
    if (role !== "ADMIN" && role !== "STAFF") throw new ApiError(403, "Forbidden");

    const { searchParams } = new URL(request.url);
    const { limit } = parsePagination(searchParams, { defaultLimit: 50 });
    const type = searchParams.get("type"); // optional filter

    const whereClause: any = { userId: session.user.id };
    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
