import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { z } from "zod";
import {
  appendCustomerMessage,
  getConversationForUser,
} from "@/lib/customer-workflow-service";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const conversation = await getConversationForUser(db, session.user.id);
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

    const { message } = await appendCustomerMessage(
      db,
      {
        id: session.user.id,
        email: session.user.email || "unknown",
        name: session.user.name,
      },
      parsed.data,
    );
    return Response.json({ success: true, message }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
