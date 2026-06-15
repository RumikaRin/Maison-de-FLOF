import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const conversation = await db.conversation.findUnique({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return Response.json(conversation || { messages: [] });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

const messageSchema = z.object({
  content: z.string().trim().min(1, "Tin nhắn không được rỗng"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message);
    }

    let conversation = await db.conversation.findUnique({
      where: { userId: session.user.id },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          userId: session.user.id,
          status: "IN_PROGRESS",
        },
      });
    } else if (conversation.status === "CLOSED") {
      // Reopen closed conversations
      conversation = await db.conversation.update({
        where: { id: conversation.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        isAdmin: false,
        content: parsed.data.content,
      },
    });

    // Create a notification for admins if this is a new message in an existing conversation
    // or we can just unconditionally create it, but throttle it maybe?
    // For simplicity, let's notify staff if it's the first message or if we want to alert them.
    const staff = await db.user.findMany({
      where: { role: { type: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true },
    });
    
    if (staff.length > 0) {
      // Avoid spamming notifications for every message in an active chat
      // We can check if the last message from an admin was a while ago, or if there's no recent notification.
      // But for now, we will create a notification to ensure they see it.
      await db.notification.createMany({
        data: staff.map((user) => ({
          userId: user.id,
          type: "SYSTEM" as const,
          title: "Tin nhắn Live Chat mới",
          message: `${session.user?.name || "Khách hàng"}: ${message.content.slice(0, 50)}...`,
        })),
      });
    }

    return Response.json({ success: true, message }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
