import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "STAFF")) {
      throw new ApiError(401, "Unauthorized");
    }

    const { id } = await props.params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, phone: true, image: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Không tìm thấy đoạn hội thoại");
    }

    // Mark messages as read by admin
    await db.message.updateMany({
      where: { conversationId: id, isAdmin: false, isRead: false },
      data: { isRead: true },
    });

    return Response.json(conversation);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
