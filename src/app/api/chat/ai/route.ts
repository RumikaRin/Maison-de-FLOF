import { apiErrorResponse, ApiError } from "@/lib/api-auth";
import { aiChatSchema, requestAiGatewayChat } from "@/lib/chat/ai-service";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = aiChatSchema.safeParse(json);

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message || "Dữ liệu tin nhắn không hợp lệ",
      );
    }

    const result = await requestAiGatewayChat(parsed.data.messages);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: result.status },
      );
    }

    return Response.json({
      success: true,
      reply: result.reply,
      model: result.model,
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
