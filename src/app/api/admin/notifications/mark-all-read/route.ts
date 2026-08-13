import { db } from "@/lib/db";
import { apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const actor = await requireStaff();
    const updated = await db.notification.updateMany({
      where: { userId: actor.id, isRead: false },
      data: { isRead: true },
    });
    await createAuditLog(db, {
      actor,
      action: "NOTIFICATIONS_MARKED_READ",
      entityType: "Notification",
      entityId: actor.id,
      afterData: { isRead: true, affectedCount: updated.count },
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
