import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }
    if (role !== "ADMIN" && role !== "STAFF") throw new ApiError(403, "Forbidden");

    const { id } = await props.params;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== session.user.id) {
      throw new ApiError(404, "Notification not found");
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });
    await createAuditLog(db, {
      actor: {
        id: session.user.id,
        email: session.user.email || "unknown",
      },
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
