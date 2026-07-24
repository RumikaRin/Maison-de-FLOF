import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }
    if (role !== "ADMIN" && role !== "STAFF") throw new ApiError(403, "Forbidden");

    const conversations = await db.conversation.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true, image: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get latest message for preview
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(conversations);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

const replySchema = z.object({
  conversationId: z.string().trim().min(1),
  content: z.string().trim().min(1, "Nội dung phản hồi không được trống"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }
    if (role !== "ADMIN" && role !== "STAFF") throw new ApiError(403, "Forbidden");

    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message);
    }

    const message = await db.message.create({
      data: {
        conversationId: parsed.data.conversationId,
        senderId: session.user.id,
        isAdmin: true,
        content: parsed.data.content,
      },
    });

    // Update conversation updatedAt so it floats to top
    await db.conversation.update({
      where: { id: parsed.data.conversationId },
      data: { updatedAt: new Date(), status: "IN_PROGRESS" },
    });
    await createAuditLog(db, {
      actor: {
        id: session.user.id,
        email: session.user.email || "unknown",
      },
      action: "CHAT_REPLY_SENT",
      entityType: "Conversation",
      entityId: parsed.data.conversationId,
      afterData: { messageId: message.id, status: "IN_PROGRESS" },
    });

    return Response.json({ success: true, message }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
