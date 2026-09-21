import { z } from "zod";
import { apiErrorResponse, requireAdmin, ApiError } from "@/lib/api-auth";
import { discoverAiModels, getAiProviderConfig } from "@/lib/chat/ai-service";

const discoverySchema = z.object({
  baseUrl: z.string().trim().optional(),
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
    const apiKeyToUse =
      parsed.data.apiKey !== undefined && parsed.data.apiKey !== ""
        ? parsed.data.apiKey
        : current.apiKey;

    const result = await discoverAiModels({
      ...parsed.data,
      apiKey: apiKeyToUse,
    });

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
