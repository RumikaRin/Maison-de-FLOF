import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  aiChatSchema,
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  type AiChatMessage,
  type AiProviderConfig,
  type AiChatResult,
} from "./ai-constants.ts";
import { getCachedCatalogKnowledge } from "./ai-catalog-knowledge.ts";
import { getActiveKnowledgePromptContext } from "./ai-knowledge-service.ts";

import { encryptAiApiKey, decryptAiApiKey } from "./ai-crypto.ts";

export {
  aiChatSchema,
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  type AiChatMessage,
  type AiProviderConfig,
  type AiChatResult,
  getCachedCatalogKnowledge,
  getActiveKnowledgePromptContext,
  encryptAiApiKey,
  decryptAiApiKey,
};

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "ai-provider-config.json");

/**
 * Returns true when running on Vercel (read-only filesystem, `data/` not deployed).
 * Set automatically by Vercel during build and runtime.
 */
export function isVercelEnvironment(): boolean {
  return Boolean(process.env.VERCEL);
}

export async function getAiProviderConfig(): Promise<AiProviderConfig> {
  const envBaseUrl = process.env.AI_GATEWAY_BASE_URL || "http://127.0.0.1:8317";
  const envApiKey = process.env.AI_GATEWAY_API_KEY || process.env.AI_PROVIDER_API_KEY || "";
  const envModel = process.env.AI_GATEWAY_MODEL || "claude-sonnet-4-6";

  try {
    const raw = await readFile(CONFIG_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AiProviderConfig>;
    const decryptedKey = decryptAiApiKey(parsed.apiKey);
    const effectiveKey = decryptedKey || envApiKey;

    return {
      providerType: parsed.providerType || "gateway",
      baseUrl: parsed.baseUrl || envBaseUrl,
      apiKey: effectiveKey,
      authScheme: parsed.authScheme || "bearer",
      model: parsed.model || envModel,
      streamIdleTimeout: parsed.streamIdleTimeout ?? 300,
      customHeaders: parsed.customHeaders || {},
      systemPrompt: parsed.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      temperature: parsed.temperature ?? 0.7,
      maxTokens: parsed.maxTokens ?? 500,
    };
  } catch {
    return {
      providerType: "gateway",
      baseUrl: envBaseUrl,
      apiKey: envApiKey,
      authScheme: "bearer",
      model: envModel,
      streamIdleTimeout: 300,
      customHeaders: {},
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 500,
    };
  }
}

export async function saveAiProviderConfig(config: Partial<AiProviderConfig>): Promise<AiProviderConfig> {
  const current = await getAiProviderConfig();
  const rawApiKey = config.apiKey !== undefined ? config.apiKey.trim() : current.apiKey;

  const updated: AiProviderConfig = {
    ...current,
    ...config,
    baseUrl: (config.baseUrl ?? current.baseUrl).trim(),
    model: (config.model ?? current.model).trim(),
    apiKey: rawApiKey,
    systemPrompt: config.systemPrompt?.trim() || current.systemPrompt,
    temperature: config.temperature !== undefined ? Number(config.temperature) : current.temperature,
    maxTokens: config.maxTokens !== undefined ? Number(config.maxTokens) : current.maxTokens,
  };

  // On Vercel the filesystem is read-only and data/ is not deployed.
  // Skip the disk write — the caller receives a "live" in-memory config
  // built from env vars that were already merged above.
  if (isVercelEnvironment()) {
    return updated;
  }

  // Encrypt the API key before persisting to disk
  const encryptedConfig = {
    ...updated,
    apiKey: encryptAiApiKey(updated.apiKey),
  };

  await mkdir(path.dirname(CONFIG_FILE_PATH), { recursive: true });
  await writeFile(CONFIG_FILE_PATH, JSON.stringify(encryptedConfig, null, 2), "utf-8");
  return updated;
}

export function buildInferenceHeaders(config: Pick<AiProviderConfig, "apiKey" | "authScheme" | "customHeaders">): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.customHeaders || {}),
  };

  if (config.apiKey) {
    if (config.authScheme === "x-api-key") {
      headers["x-api-key"] = config.apiKey;
      if (!headers["anthropic-version"]) {
        headers["anthropic-version"] = "2023-06-01";
      }
    } else {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }
  }

  return headers;
}

export function isSafeAiBaseUrl(urlString: string, isProduction = process.env.NODE_ENV === "production"): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Cloud metadata endpoints
    if (
      hostname === "169.254.169.254" ||
      hostname.startsWith("169.254.") ||
      hostname.includes("metadata.google.internal") ||
      hostname === "instance-data"
    ) {
      return false;
    }

    // In production, prohibit internal/private IP ranges and local loopback
    if (isProduction) {
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".internal") ||
        hostname.endsWith(".local")
      ) {
        return false;
      }

      const parts = hostname.split(".").map(Number);
      if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
        const [a, b] = parts;
        if (
          a === 10 ||
          a === 127 ||
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 169 && b === 254) ||
          a === 0
        ) {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function resolveChatCompletionsUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, "");
  if (clean.includes("anthropic.com")) {
    if (clean.endsWith("/messages")) {
      return clean;
    }
    if (clean.endsWith("/v1")) {
      return `${clean}/messages`;
    }
    return `${clean}/v1/messages`;
  }
  if (clean.endsWith("/chat/completions")) {
    return clean;
  }
  if (
    clean.endsWith("/v1") ||
    clean.endsWith("/openai") ||
    clean.endsWith("/v1beta/openai")
  ) {
    return `${clean}/chat/completions`;
  }
  return `${clean}/v1/chat/completions`;
}

export function resolveModelsUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, "");
  if (clean.endsWith("/models")) {
    return clean;
  }
  if (
    clean.endsWith("/v1") ||
    clean.endsWith("/openai") ||
    clean.endsWith("/v1beta/openai")
  ) {
    return `${clean}/models`;
  }
  return `${clean}/v1/models`;
}

export async function discoverAiModels(
  config: Partial<AiProviderConfig> = {},
): Promise<{ success: true; models: string[] } | { success: false; error: string }> {
  const active = await getAiProviderConfig();
  const baseUrl = config.baseUrl || active.baseUrl || "http://127.0.0.1:8317";
  const apiKey = config.apiKey !== undefined ? config.apiKey : active.apiKey;
  const authScheme = config.authScheme || active.authScheme;
  const customHeaders = config.customHeaders || active.customHeaders;

  const endpoint = resolveModelsUrl(baseUrl);
  const headers = buildInferenceHeaders({ apiKey, authScheme, customHeaders });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `Máy chủ trả về lỗi ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as { data?: Array<{ id: string }> };
    if (!data.data || !Array.isArray(data.data)) {
      return {
        success: false,
        error: "Định dạng danh sách models không hợp lệ từ gateway.",
      };
    }

    const rawModels = data.data.map((m) => m.id).filter(Boolean);
    const models = rawModels
      .map((id) => id.replace(/^models\//, ""))
      .filter((id) => !id.includes("embedding") && !id.includes("tts") && !id.includes("imagen") && !id.includes("aqa"))
      .sort((a, b) => {
        const aIsFlash = a.includes("flash") ? 1 : 0;
        const bIsFlash = b.includes("flash") ? 1 : 0;
        if (aIsFlash !== bIsFlash) return bIsFlash - aIsFlash;
        return a.localeCompare(b);
      });
    return { success: true, models };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Không thể kết nối tới ${endpoint}: ${message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function testAiConnection(
  config: Partial<AiProviderConfig> = {},
): Promise<{ success: true; latencyMs: number; reply: string; model: string } | { success: false; latencyMs: number; error: string; status?: number }> {
  const active = await getAiProviderConfig();
  const baseUrl = config.baseUrl || active.baseUrl || "http://127.0.0.1:8317";
  const apiKey = config.apiKey !== undefined ? config.apiKey : active.apiKey;
  const authScheme = config.authScheme || active.authScheme;
  const model = config.model || active.model || "claude-sonnet-4-6";
  const customHeaders = config.customHeaders || active.customHeaders;

  const endpoint = resolveChatCompletionsUrl(baseUrl);
  const headers = buildInferenceHeaders({ apiKey, authScheme, customHeaders });

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const isAnthropic = baseUrl.includes("anthropic.com");
  const testBody = isAnthropic
    ? {
        model,
        messages: [{ role: "user", content: "Ping: Xin chào" }],
        max_tokens: 30,
      }
    : {
        model,
        messages: [{ role: "user", content: "Ping: Xin chào" }],
        max_tokens: 30,
        temperature: 0.5,
      };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(testBody),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[AI Provider Test] HTTP Error ${res.status}:`, errorText);
      let friendlyError = `Máy chủ AI phản hồi lỗi (${res.status}). Vui lòng kiểm tra lại cấu hình.`;
      if (res.status === 429) {
        if (errorText.includes("limit: 0") || errorText.includes("free_tier")) {
          friendlyError = `Model "${model}" không hỗ trợ gói miễn phí của Google AI Studio (Quota limit: 0). Vui lòng chọn model Flash hoàn toàn miễn phí như "gemini-2.5-flash" hoặc "gemini-flash-latest".`;
        } else {
          friendlyError = `Đã vượt quá hạn ngạch (429 Too Many Requests / Quota Exceeded). Vui lòng chờ vài giây hoặc chuyển sang model Flash miễn phí (gemini-2.5-flash).`;
        }
      } else if (res.status === 401 || res.status === 403) {
        friendlyError = `Xác thực không thành công (${res.status}): API Key chưa hợp lệ hoặc không có quyền truy cập.`;
      } else if (res.status === 400) {
        friendlyError = `Yêu cầu không hợp lệ (${res.status}): Vui lòng kiểm tra lại tên model "${model}".`;
      } else if (res.status === 404) {
        friendlyError = `Không tìm thấy endpoint (${res.status}). Vui lòng kiểm tra lại Base URL.`;
      }
      return {
        success: false,
        latencyMs,
        status: res.status,
        error: friendlyError,
      };
    }

    const data = await res.json();
    const reply =
      (Array.isArray(data.content)
        ? data.content.map((c: { text?: string }) => c.text || "").join("")
        : null) ||
      data.choices?.[0]?.message?.content ||
      data.message?.content ||
      data.reply ||
      "OK";

    return {
      success: true,
      latencyMs,
      reply: typeof reply === "string" ? reply.trim() : JSON.stringify(reply),
      model,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      latencyMs,
      error: `Lỗi kết nối tới ${endpoint}: ${message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestAiGatewayChat(
  messages: AiChatMessage[],
  overrideConfig: Partial<AiProviderConfig> = {},
): Promise<AiChatResult> {
  const config = {
    ...(await getAiProviderConfig()),
    ...overrideConfig,
  };

  const baseUrl = config.baseUrl;
  const endpoint = resolveChatCompletionsUrl(baseUrl);
  const headers = buildInferenceHeaders(config);

  const [catalogKnowledge, customKnowledge] = await Promise.all([
    getCachedCatalogKnowledge(),
    getActiveKnowledgePromptContext(),
  ]);

  const knowledgeSections: string[] = [];
  if (catalogKnowledge) {
    knowledgeSections.push(catalogKnowledge);
  }
  if (customKnowledge) {
    knowledgeSections.push(customKnowledge);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
  const realTimeContext = `[THỜI GIAN HIỆN TẠI]: Hôm nay là ${dateStr} (${timeStr}, giờ Việt Nam - ICT). Khi người dùng hỏi về ngày, giờ hoặc thời gian, hãy luôn trả lời chính xác theo mốc thời gian này.`;

  const basePrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const promptWithTime = `${basePrompt}\n\n${realTimeContext}`;
  const combinedSystemPrompt = knowledgeSections.length > 0
    ? `${promptWithTime}\n\n==================== KHO TRI THỨC & DỮ LIỆU SẢN PHẨM ====================\n${knowledgeSections.join("\n\n========================================\n\n")}\n\n========================================\nCHỈ DẪN QUAN TRỌNG: Hãy trả lời NGẮN GỌN (dưới 120 từ), súc tích, đi thẳng vào câu hỏi. Sử dụng thông tin chính xác về dòng sơn Jotun, mã màu và định mức từ danh mục trên. Tuyệt đối không viết bài luận dài lê thê hay liệt kê các thương hiệu khác.`
    : promptWithTime;

  const outboundMessages = [
    { role: "system", content: combinedSystemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const controller = new AbortController();
  const timeoutSec = config.streamIdleTimeout || 60;
  const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);

  const isAnthropic = baseUrl.includes("anthropic.com");
  const requestBody = isAnthropic
    ? {
        model: config.model,
        system: combinedSystemPrompt,
        messages: messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 500,
      }
    : {
        model: config.model,
        messages: outboundMessages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 500,
      };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (networkError) {
    console.error("[AI Gateway] Network connection failed:", networkError);
    return {
      success: false,
      error:
        "Không thể kết nối đến máy chủ AI (Inference Gateway). Quản trị viên vui lòng kiểm tra cấu hình trong trang Admin > Tin nhắn > Cấu hình AI Provider.",
      status: 503,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[AI Gateway] Error ${res.status}:`, errorBody);

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        error:
          "Xác thực Gateway AI không thành công (API Key chưa hợp lệ). Vui lòng cập nhật lại API Key trong trang Admin.",
        status: 401,
      };
    }

    if (res.status === 400) {
      return {
        success: false,
        error: `Yêu cầu không hợp lệ (${res.status}): Có thể tên model "${config.model}" chưa đúng hoặc gateway chưa hỗ trợ. Vui lòng vào trang Admin để đổi model khác.`,
        status: 400,
      };
    }

    if (res.status === 429) {
      const isFreeTierLimit0 = errorBody.includes("limit: 0") || errorBody.includes("free_tier");
      return {
        success: false,
        error: isFreeTierLimit0
          ? `Model "${config.model}" không hỗ trợ gói miễn phí của Google AI Studio (Quota limit: 0). Vui lòng vào trang Admin đổi sang model "gemini-2.5-flash" hoặc "gemini-flash-latest" hoàn toàn miễn phí.`
          : "Hệ thống AI đang tạm thời vượt quá giới hạn lượt gọi (429). Vui lòng thử lại sau giây lát hoặc đổi sang model gemini-2.5-flash.",
        status: 429,
      };
    }

    return {
      success: false,
      error: `Máy chủ AI phản hồi lỗi (${res.status}). Vui lòng kiểm tra lại cấu hình model hoặc thử lại sau.`,
      status: res.status,
    };
  }

  const data = await res.json();
  const replyContent =
    (Array.isArray(data.content)
      ? data.content.map((c: { text?: string }) => c.text || "").join("")
      : "") ||
    data.choices?.[0]?.message?.content ||
    data.message?.content ||
    data.reply ||
    "";

  if (!replyContent) {
    return {
      success: false,
      error: "Không nhận được phản hồi nội dung từ mô hình AI.",
      status: 502,
    };
  }

  return {
    success: true,
    reply: replyContent,
    model: config.model,
  };
}
