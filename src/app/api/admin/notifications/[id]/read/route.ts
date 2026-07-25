import { db } from "@/lib/db";
import { apiErrorResponse, ApiError, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireStaff();
    const { id } = await props.params;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== actor.id) {
      throw new ApiError(404, "Notification not found");
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });
    await createAuditLog(db, {
      actor,
      action: "NOTIFICATION_MARKED_READ",
      entityType: "Notification",
      entityId: id,
      afterData: { isRead: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
