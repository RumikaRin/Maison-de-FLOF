import { db } from "@/lib/db";
import { apiErrorResponse, ApiError, requireStaff } from "@/lib/api-auth";
import { z } from "zod";
import {
  appendStaffMessage,
  listStaffConversations,
} from "@/lib/customer-workflow-service";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const conversations = await listStaffConversations(db);
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
    const actor = await requireStaff();
    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message);
    }

    const message = await appendStaffMessage(
      db,
      actor,
      parsed.data.conversationId,
      parsed.data.content,
    );
    return Response.json({ success: true, message }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
