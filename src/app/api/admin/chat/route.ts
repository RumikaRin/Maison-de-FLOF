import { z } from "zod";
import { ApiError, apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const updateChatSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]),
  adminNote: z.string().trim().max(2000).optional(),
});

export async function GET() {
  try {
    await requireStaff();
    const messages = await db.chatMessage.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(messages);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireStaff();
    const parsed = updateChatSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Dữ liệu tin nhắn không hợp lệ");

    const message = await db.chatMessage.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote || null,
      },
    });
    await createAuditLog(db, {
      actor,
      action: "CHAT_STATUS_CHANGED",
      entityType: "ChatMessage",
      entityId: message.id,
      afterData: { status: message.status, hasAdminNote: Boolean(message.adminNote) },
    });
    return Response.json(message);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
