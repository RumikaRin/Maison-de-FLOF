import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }
    if (role !== "ADMIN" && role !== "STAFF") throw new ApiError(403, "Forbidden");

    const updated = await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    await createAuditLog(db, {
      actor: {
        id: session.user.id,
        email: session.user.email || "unknown",
      },
      action: "NOTIFICATIONS_MARKED_READ",
      entityType: "Notification",
      entityId: session.user.id,
      afterData: { isRead: true, affectedCount: updated.count },
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
