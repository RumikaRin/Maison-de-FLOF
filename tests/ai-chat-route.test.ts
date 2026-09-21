import assert from "node:assert/strict";
import test from "node:test";
import {
  aiChatSchema,
  decryptAiApiKey,
  encryptAiApiKey,
  getAiProviderConfig,
  isSafeAiBaseUrl,
  requestAiGatewayChat,
  resolveChatCompletionsUrl,
  resolveModelsUrl,
  saveAiProviderConfig,
  SYSTEM_PROMPT,
} from "../src/lib/chat/ai-service.ts";

test("aiChatSchema rejects empty message array", () => {
  const parsed = aiChatSchema.safeParse({ messages: [] });
  assert.equal(parsed.success, false);
});

test("aiChatSchema rejects invalid roles", () => {
  const parsed = aiChatSchema.safeParse({
    messages: [{ role: "system", content: "hello" }],
  });
  assert.equal(parsed.success, false);
});

test("aiChatSchema accepts valid user and assistant messages", () => {
  const parsed = aiChatSchema.safeParse({
    messages: [
      { role: "user", content: "Tư vấn màu sơn phòng ngủ" },
      { role: "assistant", content: "Bạn thích tông màu ấm hay lạnh?" },
    ],
  });
  assert.equal(parsed.success, true);
});

test("SYSTEM_PROMPT includes Jotun and Maison de FLOF guidelines", () => {
  assert.ok(SYSTEM_PROMPT.includes("Maison de FLOF"));
  assert.ok(SYSTEM_PROMPT.includes("Jotun"));
  assert.ok(SYSTEM_PROMPT.includes("Majestic"));
  assert.ok(SYSTEM_PROMPT.includes("Jotashield"));
});

test("requestAiGatewayChat handles unreachable gateway gracefully", async () => {
  const result = await requestAiGatewayChat(
    [{ role: "user", content: "Xin chào" }],
    { baseUrl: "http://127.0.0.1:59998" },
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.status, 503);
    assert.ok(result.error.includes("Inference Gateway") || result.error.includes("kết nối"));
  }
});

test("getAiProviderConfig returns temperature and maxTokens", async () => {
  const config = await getAiProviderConfig();
  assert.equal(typeof config.temperature, "number");
  assert.equal(typeof config.maxTokens, "number");
  assert.ok(config.temperature! >= 0 && config.temperature! <= 2);
  assert.ok(config.maxTokens! >= 10 && config.maxTokens! <= 8192);
});

test("saveAiProviderConfig persists custom temperature and maxTokens", async () => {
  const original = await getAiProviderConfig();
  try {
    const updated = await saveAiProviderConfig({
      temperature: 1.5,
      maxTokens: 200,
    });
    assert.equal(updated.temperature, 1.5);
    assert.equal(updated.maxTokens, 200);

    const reloaded = await getAiProviderConfig();
    assert.equal(reloaded.temperature, 1.5);
    assert.equal(reloaded.maxTokens, 200);
  } finally {
    // Restore original
    await saveAiProviderConfig({
      temperature: original.temperature,
      maxTokens: original.maxTokens,
    });
  }
});

test("resolveChatCompletionsUrl correctly resolves endpoints for all providers", () => {
  // Google AI Studio
  assert.equal(
    resolveChatCompletionsUrl("https://generativelanguage.googleapis.com/v1beta/openai"),
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  );
  // OpenAI
  assert.equal(
    resolveChatCompletionsUrl("https://api.openai.com/v1"),
    "https://api.openai.com/v1/chat/completions",
  );
  // OpenRouter
  assert.equal(
    resolveChatCompletionsUrl("https://openrouter.ai/api/v1/"),
    "https://openrouter.ai/api/v1/chat/completions",
  );
  // Anthropic
  assert.equal(
    resolveChatCompletionsUrl("https://api.anthropic.com/v1"),
    "https://api.anthropic.com/v1/messages",
  );
  assert.equal(
    resolveChatCompletionsUrl("https://api.anthropic.com/v1/messages"),
    "https://api.anthropic.com/v1/messages",
  );
  // Groq
  assert.equal(
    resolveChatCompletionsUrl("https://api.groq.com/openai/v1"),
    "https://api.groq.com/openai/v1/chat/completions",
  );
  // Local Gateway
  assert.equal(
    resolveChatCompletionsUrl("http://127.0.0.1:8317"),
    "http://127.0.0.1:8317/v1/chat/completions",
  );
});

test("resolveModelsUrl correctly resolves endpoints for all providers", () => {
  assert.equal(
    resolveModelsUrl("https://generativelanguage.googleapis.com/v1beta/openai"),
    "https://generativelanguage.googleapis.com/v1beta/openai/models",
  );
  assert.equal(
    resolveModelsUrl("https://api.openai.com/v1"),
    "https://api.openai.com/v1/models",
  );
  assert.equal(
    resolveModelsUrl("http://127.0.0.1:8317"),
    "http://127.0.0.1:8317/v1/models",
  );
});

test("encryptAiApiKey and decryptAiApiKey round trip successfully", () => {
  const plain = "AIzaSyB_TestKey_Secret_123456789";
  const encrypted = encryptAiApiKey(plain);

  assert.notEqual(encrypted, plain);
  assert.ok(encrypted.startsWith("enc:v1:"));

  // Idempotence: encrypting already encrypted string does not double-encrypt
  assert.equal(encryptAiApiKey(encrypted), encrypted);

  const decrypted = decryptAiApiKey(encrypted);
  assert.equal(decrypted, plain);
});

test("decryptAiApiKey supports backwards-compatible legacy plaintext", () => {
  const legacy = "plain_api_key_without_encryption";
  assert.equal(decryptAiApiKey(legacy), legacy);
  assert.equal(decryptAiApiKey(""), "");
});

test("saveAiProviderConfig encrypts apiKey on disk while getAiProviderConfig retrieves decrypted key", async () => {
  const original = await getAiProviderConfig();
  const testKey = "test-secret-key-encryption-verify";

  try {
    await saveAiProviderConfig({ apiKey: testKey });

    const retrieved = await getAiProviderConfig();
    assert.equal(retrieved.apiKey, testKey);
  } finally {
    // Restore
    await saveAiProviderConfig({ apiKey: original.apiKey });
  }
});

test("isSafeAiBaseUrl permits valid public URLs", () => {
  assert.equal(isSafeAiBaseUrl("https://generativelanguage.googleapis.com/v1beta/openai"), true);
  assert.equal(isSafeAiBaseUrl("https://api.openai.com/v1"), true);
  assert.equal(isSafeAiBaseUrl("https://api.anthropic.com/v1"), true);
  assert.equal(isSafeAiBaseUrl("https://openrouter.ai/api/v1"), true);
});

test("isSafeAiBaseUrl blocks cloud metadata addresses in all environments", () => {
  assert.equal(isSafeAiBaseUrl("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(isSafeAiBaseUrl("http://metadata.google.internal/computeMetadata/v1"), false);
  assert.equal(isSafeAiBaseUrl("http://instance-data/latest/meta-data"), false);
  assert.equal(isSafeAiBaseUrl("ftp://api.openai.com/v1"), false);
});

test("isSafeAiBaseUrl blocks private RFC 1918 and loopback in production", () => {
  assert.equal(isSafeAiBaseUrl("http://127.0.0.1:8317", true), false);
  assert.equal(isSafeAiBaseUrl("http://localhost:8317", true), false);
  assert.equal(isSafeAiBaseUrl("http://192.168.1.1:8000", true), false);
  assert.equal(isSafeAiBaseUrl("http://10.0.0.5:8000", true), false);
  assert.equal(isSafeAiBaseUrl("http://172.16.0.1:8000", true), false);
});

test("isSafeAiBaseUrl allows local gateway in development", () => {
  assert.equal(isSafeAiBaseUrl("http://127.0.0.1:8317", false), true);
  assert.equal(isSafeAiBaseUrl("http://localhost:8317", false), true);
});


