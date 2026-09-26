import { z } from "zod";
import { apiErrorResponse, requireAdmin, ApiError } from "@/lib/api-auth";
import { discoverAiModels, getAiProviderConfig, isSafeAiBaseUrl } from "@/lib/chat/ai-service";

const discoverySchema = z.object({
  baseUrl: z
    .string()
    .trim()
    .url("Base URL phải là một URL hợp lệ")
    .refine(
      (url) => isSafeAiBaseUrl(url),
      "Base URL không an toàn hoặc trỏ tới địa chỉ IP nội bộ / metadata bị cấm",
    )
    .optional(),
  apiKey: z.string().optional(),
  authScheme: z.enum(["bearer", "x-api-key"]).optional(),
  customHeaders: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = discoverySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Tham số không hợp lệ");
    }

    const current = await getAiProviderConfig();
    const isDifferentHost =
      Boolean(parsed.data.baseUrl &&
      parsed.data.baseUrl.trim() !== "" &&
      parsed.data.baseUrl.trim() !== current.baseUrl);

    const apiKeyToUse =
      parsed.data.apiKey !== undefined && parsed.data.apiKey !== ""
        ? parsed.data.apiKey
        : (isDifferentHost ? undefined : current.apiKey);

    const result = await discoverAiModels({
      ...parsed.data,
      apiKey: apiKeyToUse,
    });

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
