"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  RotateCcw,
  Zap,
  Globe,
  Key,
  Layers,
  Cpu,
  Terminal,
  Sliders,
  CloudAlert,
} from "lucide-react";
import { toast } from "@/components/ui/csp-toast";
import { useLanguageStore } from "@/store/language-store";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/chat/ai-constants";

type ProviderConfig = {
  providerType: "gateway" | "direct";
  baseUrl: string;
  apiKey: string;
  authScheme: "bearer" | "x-api-key";
  model: string;
  streamIdleTimeout: number;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  apiKeyMasked?: string;
  hasApiKey?: boolean;
};

type TestResult =
  | { success: true; latencyMs: number; reply: string; model: string }
  | { success: false; latencyMs: number; error: string; status?: number };

const AI_PRESETS = [
  {
    id: "google",
    name: "Google AI Studio",
    tag: "Gemini",
    providerType: "direct" as const,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    authScheme: "bearer" as const,
    placeholderKey: "Dán Gemini API key (AQ... hoặc AIzaSy...)",
    keyHint: "Lấy API key tại: aistudio.google.com/app/apikey (Dùng model Flash để được miễn phí)",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tag: "All-in-One",
    providerType: "direct" as const,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemini-2.0-flash-001",
    authScheme: "bearer" as const,
    placeholderKey: "Dán OpenRouter API key (sk-or-v1-...)",
    keyHint: "Dùng chung Claude, GPT, Gemini tại: openrouter.ai/keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    tag: "Claude 3.5",
    providerType: "direct" as const,
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-sonnet-latest",
    authScheme: "x-api-key" as const,
    placeholderKey: "Dán Anthropic API key (sk-ant-api03-...)",
    keyHint: "Lấy API key tại: console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI Chính hãng",
    tag: "GPT-4o",
    providerType: "direct" as const,
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    authScheme: "bearer" as const,
    placeholderKey: "Dán OpenAI API key (sk-proj-...)",
    keyHint: "Lấy API key tại: platform.openai.com/api-keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    tag: "Tiết kiệm",
    providerType: "direct" as const,
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    authScheme: "bearer" as const,
    placeholderKey: "Dán DeepSeek API key (sk-...)",
    keyHint: "Lấy API key tại: platform.deepseek.com/api_keys",
  },
  {
    id: "gateway",
    name: "Local Gateway",
    tag: "FLOF Proxy",
    providerType: "gateway" as const,
    baseUrl: "http://127.0.0.1:8317",
    model: "gemini-3-flash",
    authScheme: "bearer" as const,
    placeholderKey: "123456 (hoặc để trống nếu local)",
    keyHint: "Inference Gateway proxy cục bộ trên máy chủ của bạn",
  },
];

function updateSliderProgress(el: HTMLInputElement | null, min: number, max: number, val: number) {
  if (!el) return;
  const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  el.style.setProperty("--slider-progress", `${pct}%`);
}

export function AiProviderSettings() {
  const { language } = useLanguageStore();

  const [config, setConfig] = useState<ProviderConfig>({
    providerType: "gateway",
    baseUrl: "http://127.0.0.1:8317",
    apiKey: "",
    authScheme: "bearer",
    model: "claude-sonnet-4-6",
    streamIdleTimeout: 300,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 500,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [vercelMode, setVercelMode] = useState(false);

  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Load current config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/chat/ai-settings");
        if (!res.ok) throw new Error("Không thể tải cấu hình");
        const data = await res.json();
        if (data.vercelMode) setVercelMode(true);
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            apiKey: data.config.apiKey || "",
            temperature: data.config.temperature !== undefined ? Number(data.config.temperature) : 0.7,
            maxTokens: data.config.maxTokens !== undefined ? Number(data.config.maxTokens) : 500,
          }));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Lỗi tải cấu hình");
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, []);

  // Test connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/chat/ai-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          authScheme: config.authScheme,
          model: config.model,
        }),
      });

      const data = (await res.json()) as TestResult;
      setTestResult(data);

      if (data.success) {
        toast.success(
          language === "vi"
            ? `Kết nối thành công (${data.latencyMs}ms)!`
            : `Connection successful (${data.latencyMs}ms)!`,
        );
      } else {
        toast.error(
          language === "vi"
            ? `Kết nối thất bại: ${data.error}`
            : `Connection failed: ${data.error}`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kiểm tra kết nối";
      setTestResult({ success: false, latencyMs: 0, error: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  // Discover models
  const handleDiscoverModels = async () => {
    setDiscovering(true);

    try {
      const res = await fetch("/api/admin/chat/ai-settings/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          authScheme: config.authScheme,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setDiscoveredModels(data.models);
        toast.success(
          language === "vi"
            ? `Đã tìm thấy ${data.models.length} models từ Gateway!`
            : `Discovered ${data.models.length} models from Gateway!`,
        );
      } else {
        toast.error(data.error || "Không thể quét danh sách models");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi quét models");
    } finally {
      setDiscovering(false);
    }
  };

  // Save config
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/chat/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể lưu cấu hình");
      }

      toast.success(
        language === "vi"
          ? "Đã lưu cấu hình AI Provider thành công!"
          : "AI Provider settings saved successfully!",
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (preset: (typeof AI_PRESETS)[number]) => {
    setConfig((prev) => ({
      ...prev,
      providerType: preset.providerType,
      baseUrl: preset.baseUrl,
      model: preset.model,
      authScheme: preset.authScheme,
    }));
    toast.success(
      language === "vi"
        ? `Đã chọn ${preset.name}! Hãy dán API key của bạn và nhấn Apply Changes.`
        : `Selected ${preset.name}! Enter your API key and click Apply Changes.`,
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-white rounded-2xl border border-warm-200">
        <div className="flex items-center gap-2 text-warm-600 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-jotun-teal" />
          <span>{language === "vi" ? "Đang tải cấu hình AI..." : "Loading AI configuration..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 w-full pr-2">
      {/* Header card styled like Claude Desktop Inference Config */}
      <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warm-900 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold text-warm-900">
              {language === "vi" ? "Cấu hình Third-party Inference" : "Configure third-party inference"}
            </h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Active
            </span>
          </div>
          <p className="mt-1 text-xs text-warm-550 max-w-2xl">
            {language === "vi"
              ? "Tùy chỉnh điểm cuối suy luận AI (Inference Gateway / OpenAI-compatible / Local CLI Proxy) cho Trợ lý ảo Maison de FLOF."
              : "Choose where Maison de FLOF chatbot sends inference requests (Gateway / OpenAI-compatible endpoint)."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-4 py-2.5 text-xs font-bold text-warm-800 shadow-2xs hover:bg-warm-50 disabled:opacity-50 transition"
          >
            {testing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-jotun-teal" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span>{language === "vi" ? "Test connection" : "Test connection"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-warm-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-warm-850 disabled:opacity-50 transition"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{language === "vi" ? "Apply Changes" : "Apply Changes"}</span>
          </button>
        </div>
      </div>

      {/* Test Connection Banner */}
      {testResult && (
        <div
          className={`rounded-2xl border p-4 text-xs shadow-2xs flex items-start gap-3 ${
            testResult.success
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              : "border-rose-200 bg-rose-50/70 text-rose-900"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <strong className="font-bold">
                {testResult.success
                  ? language === "vi"
                    ? `Kết nối thành công! (Độ trễ: ${testResult.latencyMs}ms)`
                    : `Connection successful! (Latency: ${testResult.latencyMs}ms)`
                  : language === "vi"
                  ? `Kết nối thất bại (Mã: ${testResult.status || "Network Error"})`
                  : `Connection failed (Status: ${testResult.status || "Network Error"})`}
              </strong>
              {testResult.success && (
                <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-md">
                  Model: {testResult.model}
                </span>
              )}
            </div>
            {testResult.success ? (
              <p className="text-[11px] text-emerald-800/90 line-clamp-2">
                <strong>Phản hồi mẫu:</strong> {testResult.reply}
              </p>
            ) : (
              <p className="text-[11px] text-rose-800 font-mono break-all">
                {testResult.error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Vercel Environment Banner ── */}
      {vercelMode && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <CloudAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="font-bold text-sm text-amber-900">
                  {language === "vi"
                    ? "⚠️ Môi trường Vercel — Cấu hình không lưu được vào file"
                    : "⚠️ Vercel Environment — File-based config is not available"}
                </p>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  {language === "vi"
                    ? "Trên Vercel, thư mục data/ không tồn tại (bị .gitignore) và filesystem là read-only. Cấu hình bạn nhập ở đây chỉ có hiệu lực trong phiên hiện tại. Để lưu vĩnh viễn, hãy cài đặt các biến môi trường sau trong "
                    : "On Vercel, the data/ directory does not exist (git-ignored) and the filesystem is read-only. Changes made here only last for this session. To persist them, set these environment variables in "}
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-amber-700 hover:text-amber-900"
                  >
                    Vercel Dashboard → Settings → Environment Variables
                  </a>
                  .
                </p>
              </div>

              {/* Env var table */}
              <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-100 bg-amber-50/80">
                      <th className="text-left px-3 py-2 font-bold text-amber-900 whitespace-nowrap">Biến môi trường</th>
                      <th className="text-left px-3 py-2 font-bold text-amber-900">Giá trị cần điền</th>
                      <th className="text-left px-3 py-2 font-bold text-amber-900 hidden sm:table-cell">Bắt buộc?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    <tr className="hover:bg-amber-50/40">
                      <td className="px-3 py-2 font-mono font-bold text-rose-700 whitespace-nowrap">AI_PROVIDER_API_KEY</td>
                      <td className="px-3 py-2 text-warm-700">API key của provider (Google, Anthropic, OpenAI...)</td>
                      <td className="px-3 py-2 hidden sm:table-cell"><span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Bắt buộc</span></td>
                    </tr>
                    <tr className="hover:bg-amber-50/40">
                      <td className="px-3 py-2 font-mono font-bold text-warm-700 whitespace-nowrap">AI_GATEWAY_BASE_URL</td>
                      <td className="px-3 py-2 text-warm-600 font-mono text-[11px] break-all">{config.baseUrl || "https://generativelanguage.googleapis.com/v1beta/openai"}</td>
                      <td className="px-3 py-2 hidden sm:table-cell"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Khuyến nghị</span></td>
                    </tr>
                    <tr className="hover:bg-amber-50/40">
                      <td className="px-3 py-2 font-mono font-bold text-warm-700 whitespace-nowrap">AI_GATEWAY_MODEL</td>
                      <td className="px-3 py-2 text-warm-600 font-mono text-[11px]">{config.model || "gemini-2.5-flash"}</td>
                      <td className="px-3 py-2 hidden sm:table-cell"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Khuyến nghị</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-amber-700">
                💡 {language === "vi"
                  ? "Sau khi cài đặt env vars → Redeploy trên Vercel → AI sẽ hoạt động ổn định mà không cần cấu hình lại."
                  : "After setting env vars → Redeploy on Vercel → AI will work stably without reconfiguring."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Provider Presets */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-100 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-jotun-teal" />
            <h3 className="font-bold text-sm text-warm-900">
              {language === "vi" ? "Chọn nhanh Nhà cung cấp (Quick Provider Presets)" : "Quick Provider Presets"}
            </h3>
          </div>
          <span className="text-[11px] text-warm-500">
            {language === "vi"
              ? "Bấm vào mẫu để tự động điền Base URL & Model chuẩn"
              : "Click any provider to auto-fill recommended Base URL & Model"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AI_PRESETS.map((p) => {
            const isActive =
              config.baseUrl.trim().replace(/\/+$/, "") === p.baseUrl.trim().replace(/\/+$/, "");
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`flex flex-col justify-between p-3 rounded-xl border text-left transition cursor-pointer min-h-[72px] ${
                  isActive
                    ? "border-jotun-teal bg-jotun-teal/5 ring-1 ring-jotun-teal shadow-2xs"
                    : "border-warm-200 bg-warm-50/40 hover:bg-white hover:border-jotun-teal/50 hover:shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between w-full gap-1">
                  <span className="font-bold text-xs text-warm-900 truncate">{p.name}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isActive
                        ? "bg-jotun-teal text-white"
                        : "bg-warm-200/80 text-warm-800"
                    }`}
                  >
                    {p.tag}
                  </span>
                </div>
                <div className="text-[10px] text-warm-500 font-mono truncate w-full mt-2">
                  {p.model}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Provider Key Guide / Instruction */}
        {(() => {
          const activePreset = AI_PRESETS.find(
            (p) => config.baseUrl.trim().replace(/\/+$/, "") === p.baseUrl.trim().replace(/\/+$/, "")
          );
          if (!activePreset) return null;
          return (
            <div className="rounded-xl bg-warm-50/70 border border-warm-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-warm-700">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-jotun-teal shrink-0" />
                <span>
                  <strong className="text-warm-900">{activePreset.name}:</strong> {activePreset.keyHint}
                </span>
              </div>
              <span className="text-[10.5px] text-warm-500 font-mono bg-white px-2 py-0.5 rounded border border-warm-200 shrink-0">
                Model: {activePreset.model}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Grid of Sections: Expanded 3 columns on wide screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Section 1: Connection */}
        <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-warm-100">
            <Globe className="h-4 w-4 text-jotun-teal" />
            <h3 className="font-bold text-sm text-warm-900">
              {language === "vi" ? "1. Thông tin Kết nối (Connection)" : "1. Connection"}
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-warm-800 mb-1">
                {language === "vi" ? "Phương thức kết nối (Connection kind)" : "Connection kind"}
              </label>
              <select
                value={config.providerType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    providerType: e.target.value as ProviderConfig["providerType"],
                  })
                }
                className="w-full h-10 rounded-xl border border-warm-200 px-3 text-xs bg-white text-warm-900 focus:border-jotun-teal outline-none"
              >
                <option value="gateway">Gateway (Local Inference Gateway / Proxy API)</option>
                <option value="direct">Direct Provider (OpenAI / Anthropic / Custom endpoint)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-warm-800 mb-1">
                Gateway Base URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="flof_ai_base_url"
                name="flof_ai_base_url"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                data-form-type="other"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="http://127.0.0.1:8317"
                className="w-full h-10 rounded-xl border border-warm-200 px-3 text-xs bg-warm-50/20 focus:bg-white focus:border-jotun-teal outline-none font-mono"
              />
              <p className="mt-1 text-[10px] text-warm-500">
                {language === "vi"
                  ? "Địa chỉ root của Inference Gateway (ví dụ: http://127.0.0.1:8317)"
                  : "Full URL of the inference gateway endpoint."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-warm-800">
                  Gateway API Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-warm-500 hover:text-jotun-teal flex items-center gap-1"
                >
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showApiKey ? "Ẩn" : "Hiện"}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="flof_ai_token_secret"
                  name="flof_ai_token_secret"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-form-type="other"
                  data-bwignore="true"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={
                    config.apiKeyMasked
                      ? `Đang dùng: ${config.apiKeyMasked}`
                      : "Nhập Gateway API Key nếu có..."
                  }
                  className={`w-full h-10 rounded-xl border border-warm-200 px-3 pr-10 text-xs bg-warm-50/20 focus:bg-white focus:border-jotun-teal outline-none font-mono ${
                    !showApiKey ? "flof-secret-mask" : ""
                  }`}
                />
                <Key className="absolute right-3 top-3 h-4 w-4 text-warm-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-[10px] text-warm-500">
                {language === "vi"
                  ? "Tương ứng với Gateway API key trong cài đặt của bạn (ví dụ: 123456)."
                  : "Credential used for authenticating with the gateway."}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-warm-800 mb-1">
                Gateway Auth Scheme
              </label>
              <select
                value={config.authScheme}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    authScheme: e.target.value as "bearer" | "x-api-key",
                  })
                }
                className="w-full h-10 rounded-xl border border-warm-200 px-3 text-xs bg-white text-warm-900 focus:border-jotun-teal outline-none"
              >
                <option value="bearer">bearer (Authorization: Bearer &lt;key&gt;)</option>
                <option value="x-api-key">x-api-key (Header: x-api-key: &lt;key&gt;)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Models & Discovery */}
        <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-warm-100">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-jotun-teal" />
              <h3 className="font-bold text-sm text-warm-900">
                {language === "vi" ? "2. Mô hình AI (Models)" : "2. Models"}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleDiscoverModels}
              disabled={discovering}
              className="flex items-center gap-1.5 text-xs font-bold text-jotun-teal hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${discovering ? "animate-spin" : ""}`} />
              <span>{language === "vi" ? "Test model discovery" : "Test model discovery"}</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-warm-800 mb-1">
                Tên Model đang chọn (Selected Model) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="flof_ai_model_name"
                name="flof_ai_model_name"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder="claude-sonnet-4-6 hoặc gemini-3.8-flash-high"
                className="w-full h-10 rounded-xl border border-warm-200 px-3 text-xs bg-white text-warm-900 focus:border-jotun-teal outline-none font-mono font-medium"
              />
              <p className="mt-1 text-[10px] text-warm-500">
                {language === "vi"
                  ? "Tên định danh model chính xác được Gateway hỗ trợ (ví dụ: claude-sonnet-4-6, gemini-3.8-flash-high, grok-4.5)."
                  : "The exact model identifier accepted by your inference gateway."}
              </p>
            </div>

            {/* Discovered models picker */}
            {discoveredModels.length > 0 && (
              <div>
                <label className="block font-semibold text-warm-800 mb-1.5">
                  {language === "vi"
                    ? `Danh sách model phát hiện từ Gateway (${discoveredModels.length}):`
                    : `Discovered Models (${discoveredModels.length}):`}
                </label>
                <div className="max-h-40 overflow-y-auto p-2 border border-warm-200 rounded-xl bg-warm-50/50 flex flex-wrap gap-1.5">
                  {discoveredModels.map((m) => {
                    const cleanModel = m.replace(/^models\//, "");
                    const isSelected = config.model === cleanModel || config.model === m;
                    const isFlash = cleanModel.includes("flash");
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setConfig({ ...config, model: cleanModel })}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-jotun-teal text-white border-jotun-teal font-bold shadow-2xs"
                            : isFlash
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-500 font-medium"
                            : "bg-white text-warm-800 border-warm-200 hover:border-jotun-teal hover:bg-jotun-teal/5"
                        }`}
                      >
                        {isFlash && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSelected ? "bg-white" : "bg-emerald-500"
                            }`}
                          />
                        )}
                        <span>{cleanModel}</span>
                        {isFlash && (
                          <span
                            className={`text-[8.5px] px-1 py-0.5 rounded font-sans font-bold leading-none ${
                              isSelected ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            Free
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[9.5px] text-warm-500">
                  {language === "vi"
                    ? "Nhấp vào bất kỳ model nào ở trên để chọn. Các model có nhãn [Free] (như gemini-2.5-flash) được miễn phí không cần thẻ."
                    : "Click any model above to select it. Models with [Free] badge are free without billing."}
                </p>
              </div>
            )}

            <div>
              <label className="block font-semibold text-warm-800 mb-1">
                Stream idle timeout (giây)
              </label>
              <input
                type="number"
                min={10}
                max={1800}
                value={config.streamIdleTimeout}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    streamIdleTimeout: Number(e.target.value) || 300,
                  })
                }
                className="w-full h-10 rounded-xl border border-warm-200 px-3 text-xs bg-white text-warm-900 focus:border-jotun-teal outline-none"
              />
              <p className="mt-1 text-[10px] text-warm-500">
                {language === "vi"
                  ? "Thời gian chờ tối đa cho mỗi phản hồi (mặc định 300 giây)."
                  : "Extra seconds to wait for model output response. Default 300."}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Advanced Parameters */}
        <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-warm-100">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-jotun-teal" />
                <h3 className="font-bold text-sm text-warm-900">
                  {language === "vi" ? "3. Tham số Nâng cao (Parameters)" : "3. Advanced Parameters"}
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-jotun-teal bg-jotun-teal/10 px-2 py-0.5 rounded-md border border-jotun-teal/20">
                Active
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-warm-800 text-xs">
                    {language === "vi" ? "Độ sáng tạo (Temperature):" : "Creativity (Temperature):"}
                  </label>
                  <span className="font-mono font-bold text-xs bg-warm-100 text-jotun-teal px-2 py-0.5 rounded-md border border-warm-200">
                    {Number(config.temperature ?? 0.7).toFixed(2)}
                  </span>
                </div>

                <div className="py-1">
                  <input
                    ref={(el) => updateSliderProgress(el, 0, 2, config.temperature ?? 0.7)}
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={config.temperature ?? 0.7}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateSliderProgress(e.currentTarget, 0, 2, val);
                      setConfig({
                        ...config,
                        temperature: val,
                      });
                    }}
                    className="flof-range-slider"
                  />
                </div>

                <div className="flex justify-between text-[10.5px] text-warm-500 font-medium px-0.5">
                  <span>0.0 (Chính xác)</span>
                  <span>0.7 (Chuẩn)</span>
                  <span>1.5 (Sáng tạo)</span>
                </div>
              </div>

              {/* Max Tokens Slider */}
              <div className="space-y-2 pt-3 border-t border-warm-100">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-warm-800 text-xs">
                    {language === "vi" ? "Độ dài phản hồi tối đa:" : "Max response length:"}
                  </label>
                  <span className="font-mono font-bold text-xs bg-warm-100 text-jotun-teal px-2 py-0.5 rounded-md border border-warm-200">
                    {config.maxTokens ?? 500} tokens
                  </span>
                </div>

                <div className="py-1">
                  <input
                    ref={(el) => updateSliderProgress(el, 50, 1500, config.maxTokens ?? 500)}
                    type="range"
                    min={50}
                    max={1500}
                    step={25}
                    value={config.maxTokens ?? 500}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateSliderProgress(e.currentTarget, 50, 1500, val);
                      setConfig({
                        ...config,
                        maxTokens: val,
                      });
                    }}
                    className="flof-range-slider"
                  />
                </div>

                <p className="text-[10px] text-warm-500 leading-relaxed">
                  {language === "vi"
                    ? "Giới hạn số token tối đa cho mỗi phản hồi để giữ cho câu trả lời luôn ngắn gọn và tiết kiệm chi phí."
                    : "Maximum token limit per response to keep answers concise and economical."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-warm-400 border-t border-warm-100 flex items-center justify-between">
            <span>FLOF AI Tuner</span>
            <span className="font-mono text-jotun-teal font-semibold">
              Temp: {config.temperature ?? 0.7} · Max: {config.maxTokens ?? 500}t
            </span>
          </div>
        </div>
      </div>

      {/* Section 4: System Prompt & AI Persona */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-jotun-teal" />
            <h3 className="font-bold text-sm text-warm-900">
              {language === "vi" ? "4. Lời nhắc Hệ thống (System Prompt & Persona)" : "4. System Prompt & Persona"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
            className="flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-jotun-teal"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{language === "vi" ? "Khôi phục mặc định FLOF" : "Reset to default"}</span>
          </button>
        </div>

        <div>
          <textarea
            rows={10}
            value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            placeholder="Nội dung lời nhắc hệ thống định hướng phong cách và kiến thức của AI..."
            className="w-full rounded-xl border border-warm-200 p-4 text-xs font-mono text-warm-850 leading-relaxed outline-none focus:border-jotun-teal bg-warm-50/20 focus:bg-white resize-y"
          />
          <p className="mt-1.5 text-[10px] text-warm-500">
            {language === "vi"
              ? "Lời nhắc này được gửi kèm mỗi câu hỏi của khách hàng để hướng dẫn Trợ lý AI tư vấn chuẩn xác về bảng màu Jotun, quy chuẩn thi công và tinh thần thương hiệu Maison de FLOF."
              : "Defines the personality and domain knowledge of the AI paint consultant."}
          </p>
        </div>
      </div>
    </div>
  );
}
