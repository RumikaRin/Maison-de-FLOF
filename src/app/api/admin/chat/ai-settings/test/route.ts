import { z } from "zod";
import { apiErrorResponse, requireAdmin, ApiError } from "@/lib/api-auth";
import { testAiConnection, getAiProviderConfig, isSafeAiBaseUrl } from "@/lib/chat/ai-service";

const testSchema = z.object({
  baseUrl: z
    .string()
    .trim()
    .url("Base URL không hợp lệ")
    .refine(
      (url) => isSafeAiBaseUrl(url),
      "Base URL không an toàn hoặc trỏ tới địa chỉ IP nội bộ / metadata bị cấm",
    )
    .optional(),
  apiKey: z.string().optional(),
  authScheme: z.enum(["bearer", "x-api-key"]).optional(),
  model: z.string().trim().optional(),
  customHeaders: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Tham số không hợp lệ");
    }

    const current = await getAiProviderConfig();
    const apiKeyToUse =
      parsed.data.apiKey !== undefined && parsed.data.apiKey !== ""
        ? parsed.data.apiKey
        : current.apiKey;

    const result = await testAiConnection({
      ...parsed.data,
      apiKey: apiKeyToUse,
    });

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
