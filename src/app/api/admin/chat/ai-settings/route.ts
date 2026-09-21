import { z } from "zod";
import { apiErrorResponse, requireStaff, requireAdmin, ApiError } from "@/lib/api-auth";
import {
  getAiProviderConfig,
  saveAiProviderConfig,
  isSafeAiBaseUrl,
  AiProviderConfig,
} from "@/lib/chat/ai-service";

const saveConfigSchema = z.object({
  providerType: z.enum(["gateway", "direct"]).optional(),
  baseUrl: z
    .string()
    .trim()
    .url("Base URL phải là một URL hợp lệ (ví dụ: http://127.0.0.1:8317 hoặc https://api.openai.com)")
    .refine(
      (url) => isSafeAiBaseUrl(url),
      "Base URL không an toàn hoặc trỏ tới địa chỉ IP nội bộ / metadata bị cấm",
    ),
  apiKey: z.string().optional(),
  authScheme: z.enum(["bearer", "x-api-key"]).optional(),
  model: z.string().trim().min(1, "Tên model không được để trống"),
  streamIdleTimeout: z.number().int().min(5).max(1800).optional(),
  customHeaders: z.record(z.string()).optional(),
  systemPrompt: z.string().trim().min(10).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(10).max(8192).optional(),
});

export async function GET() {
  try {
    await requireStaff();
    const config = await getAiProviderConfig();

    return Response.json({
      success: true,
      config: {
        ...config,
        // Mask API key for security unless empty
        apiKeyMasked: config.apiKey ? `${config.apiKey.slice(0, 3)}••••••${config.apiKey.slice(-3)}` : "",
        hasApiKey: Boolean(config.apiKey),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = saveConfigSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ");
    }

    const current = await getAiProviderConfig();
    const newApiKey =
      parsed.data.apiKey !== undefined && parsed.data.apiKey !== ""
        ? parsed.data.apiKey
        : current.apiKey;

    const saved = await saveAiProviderConfig({
      ...parsed.data,
      apiKey: newApiKey,
    } as Partial<AiProviderConfig>);

    return Response.json({
      success: true,
      message: "Đã lưu cấu hình AI Provider thành công",
      config: {
        ...saved,
        apiKeyMasked: saved.apiKey ? `${saved.apiKey.slice(0, 3)}••••••${saved.apiKey.slice(-3)}` : "",
        hasApiKey: Boolean(saved.apiKey),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
