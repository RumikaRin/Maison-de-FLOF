import { z } from "zod";
import { apiErrorResponse, requireStaff, requireAdmin, ApiError } from "@/lib/api-auth";
import {
  getAiProviderConfig,
  saveAiProviderConfig,
  isSafeAiBaseUrl,
  isVercelEnvironment,
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
    const vercelMode = isVercelEnvironment();

    return Response.json({
      success: true,
      vercelMode,
      config: {
        ...config,
        // Mask API key for security unless empty
        apiKeyMasked: config.apiKey ? `${config.apiKey.slice(0, 3)}\u2022\u2022\u2022\u2022\u2022\u2022${config.apiKey.slice(-3)}` : "",
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

    const vercelMode = isVercelEnvironment();

    return Response.json({
      success: true,
      vercelMode,
      message: vercelMode
        ? "\u26A0\uFE0F Vercel: C\u1EA5u h\u00ECnh ch\u1EC9 c\u00F3 hi\u1EC7u l\u1EF1c trong phi\u00EAn n\u00E0y. \u0110\u1EC3 l\u01B0u v\u0129nh vi\u1EC5n, h\u00E3y c\u00E0i \u0111\u1EB7t bi\u1EBFn m\u00F4i tr\u01B0\u1EDDng tr\u00EAn Vercel Dashboard."
        : "\u0110\u00E3 l\u00E0u c\u1EA5u h\u00ECnh AI Provider th\u00E0nh c\u00F4ng",
      config: {
        ...saved,
        apiKeyMasked: saved.apiKey ? `${saved.apiKey.slice(0, 3)}\u2022\u2022\u2022\u2022\u2022\u2022${saved.apiKey.slice(-3)}` : "",
        hasApiKey: Boolean(saved.apiKey),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
