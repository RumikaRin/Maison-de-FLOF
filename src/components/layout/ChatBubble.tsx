"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/locale";
import { getMobileSurfacePolicy } from "@/lib/mobile-surface-policy";
import { cn } from "@/lib/utils";
import { AnimatePresence, safeMotion } from "@/components/ui/motion-safe";
import { Facebook, MessageCircle, Send, X, User as UserIcon, Bot, Sparkles, RotateCcw, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/csp-toast";
import { useLanguageStore } from "@/store/language-store";
import { useSession } from "next-auth/react";
import {
  calculateNextChatDelay,
  CHAT_POLL_INITIAL_DELAY,
} from "@/lib/chat/polling";

const messengerUrl = process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/maisondeflof";

type Message = {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
};

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isError?: boolean;
};

function renderFormattedInlineText(text: string, isUser: boolean) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className={isUser ? "font-bold text-white" : "font-bold text-warm-950"}>
          {inner}
        </strong>
      );
    }
    return part;
  });
}

function FormattedChatMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (elements.length > 0 && lines[i - 1]?.trim()) {
        elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      }
      continue;
    }

    if (/^[-=_*]{3,}$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-1.5 border-warm-200" />);
      continue;
    }

    const headingMatch = line.match(/^#{1,4}\s+(.*)$/);
    if (headingMatch) {
      elements.push(
        <div
          key={`heading-${i}`}
          className="font-bold text-[12px] text-warm-950 mt-1.5 mb-0.5 flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-jotun-teal inline-block shrink-0" />
          <span>{renderFormattedInlineText(headingMatch[1], false)}</span>
        </div>,
      );
      continue;
    }

    const bulletMatch = line.match(/^([*•\-]|(?:\d+\.))\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-1.5 my-0.5 text-[12px] leading-relaxed">
          <span className="text-jotun-teal font-bold shrink-0 leading-tight">•</span>
          <span className="flex-1">{renderFormattedInlineText(bulletMatch[2], false)}</span>
        </div>,
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="my-0.5 text-[12px] leading-relaxed text-warm-900">
        {renderFormattedInlineText(line, false)}
      </p>,
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export function ChatBubble() {
  const pathname = usePathname();
  const policy = getMobileSurfacePolicy(pathname || "/");
  const { language } = useLanguageStore();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  
  // View states: 'options' | 'guest-form' | 'live-chat' | 'ai-chat'
  const [view, setView] = useState<"options" | "guest-form" | "live-chat" | "ai-chat">("options");
  
  // Guest Form State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", message: "", privacyConsent: false });
  
  // Live Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const currentDelayRef = useRef<number>(CHAT_POLL_INITIAL_DELAY);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerImmediatePollRef = useRef<(() => void) | null>(null);

  // AI Chatbot State
  const [aiMessages, setAiMessages] = useState<AiMessage[]>(() => [
    {
      id: "ai-welcome",
      role: "assistant",
      content: language === "vi"
        ? "Xin chào! Tôi là Trợ lý AI của Maison de FLOF. Tôi có thể tư vấn các dòng sơn Jotun (Majestic, Jotashield, WaterGuard...), gợi ý mã màu theo phong cách nội thất và dự toán lượng sơn. Bạn cần hỗ trợ gì hôm nay?"
        : "Hello! I am the Maison de FLOF AI Assistant. I can advise on Jotun paint lines (Majestic, Jotashield, WaterGuard...), suggest colors, and estimate paint volume. How can I help you today?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync open state to document.body and dispatch custom event for ScrollToTop
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("flof-chat-toggle", { detail: { open } }),
      );
      if (open) {
        document.body.setAttribute("data-chat-open", "true");
      } else {
        document.body.removeAttribute("data-chat-open");
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.removeAttribute("data-chat-open");
      }
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (!open || view !== "ai-chat") {
      stopListening();
    }
  }, [open, view]);

  // Voice Input inside AI Chatbox (adopted from Ulra Movie pattern)
  const handleToggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.error(
        language === "vi"
          ? "Trình duyệt chưa hỗ trợ nhận diện giọng nói (Web Speech API). Bạn vui lòng dùng Google Chrome hoặc Microsoft Edge."
          : "Your browser does not support Speech Recognition. Please try Google Chrome or Microsoft Edge.",
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      recognition.lang = language === "vi" ? "vi-VN" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed" || event.error === "permission-denied") {
          toast.error(
            language === "vi"
              ? "Quyền Micro đang chờ tải lại trang. Bạn hãy bấm nút xanh 'Reload' (hoặc F5) trên trình duyệt nhé."
              : "Microphone permission pending. Click the 'Reload' button or press F5 to apply.",
          );
        } else if (event.error === "network") {
          toast.error(
            language === "vi"
              ? "Lỗi kết nối giọng nói. Vui lòng kiểm tra lại mạng hoặc tạm tắt VPN nếu đang bật."
              : "Speech service connection error. Please check connection or disable VPN.",
          );
        } else if (event.error === "audio-capture") {
          toast.error(
            language === "vi"
              ? "Không tìm thấy thiết bị Microphone hoặc Micro đang bị ứng dụng khác chiếm dụng."
              : "No microphone detected or microphone is in use by another app.",
          );
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setAiInput(transcript);
          void handleSendAiMessage(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Failed to start speech recognition", err);
      setIsListening(false);
    }
  };

  // Polling for live chat messages
  useEffect(() => {
    if (!open || view !== "live-chat" || !session?.user) {
      return;
    }

    let isCancelled = false;
    currentDelayRef.current = CHAT_POLL_INITIAL_DELAY;
    lastModifiedRef.current = null;

    const clearScheduledTimer = () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearScheduledTimer();
      if (isCancelled || (typeof document !== "undefined" && document.hidden)) {
        return;
      }
      pollTimerRef.current = setTimeout(() => {
        void executePoll();
      }, currentDelayRef.current);
    };

    const executePoll = async () => {
      clearScheduledTimer();
      if (isCancelled || (typeof document !== "undefined" && document.hidden)) {
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (lastModifiedRef.current) {
          headers["If-Modified-Since"] = lastModifiedRef.current;
        }

        const res = await fetch("/api/chat/conversation", { headers });
        if (isCancelled) return;

        if (res.status === 304) {
          currentDelayRef.current = calculateNextChatDelay(
            currentDelayRef.current,
            "not_modified",
          );
        } else if (res.ok) {
          const mod = res.headers.get("Last-Modified");
          if (mod) {
            lastModifiedRef.current = mod;
          }
          const data = await res.json();
          if (isCancelled) return;
          setMessages(data.messages || []);
          currentDelayRef.current = CHAT_POLL_INITIAL_DELAY;
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
        currentDelayRef.current = calculateNextChatDelay(
          currentDelayRef.current,
          "error",
        );
      } finally {
        if (!isCancelled) {
          scheduleNext();
        }
      }
    };

    const triggerImmediatePoll = () => {
      clearScheduledTimer();
      currentDelayRef.current = CHAT_POLL_INITIAL_DELAY;
      void executePoll();
    };

    triggerImmediatePollRef.current = triggerImmediatePoll;

    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        triggerImmediatePoll();
      } else {
        clearScheduledTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Trigger initial poll
    triggerImmediatePoll();

    return () => {
      isCancelled = true;
      triggerImmediatePollRef.current = null;
      clearScheduledTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [open, view, session?.user]);

  // Auto scroll to bottom in live chat
  useEffect(() => {
    if (view === "live-chat" && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  // Auto scroll to bottom in AI chat
  useEffect(() => {
    if (view === "ai-chat") {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, aiLoading, view]);

  const quickPrompts =
    language === "vi"
      ? [
          "Gợi ý màu sơn phòng khách hiện đại",
          "Sơn ngoại thất Jotashield loại nào bền nhất?",
          "Tính lượng sơn cho phòng 20m²",
        ]
      : [
          "Modern living room color ideas",
          "Which Jotashield is best for exterior?",
          "Estimate paint for a 20m² room",
        ];

  const handleSendAiMessage = async (customPrompt?: string) => {
    stopListening();
    const promptToSend = (customPrompt || aiInput).trim();
    if (!promptToSend || aiLoading) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptToSend,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...aiMessages, userMsg];
    setAiMessages(nextMessages);
    if (!customPrompt) {
      setAiInput("");
    }
    setAiLoading(true);

    try {
      const historyPayload = nextMessages
        .filter((m) => !m.isError && m.id !== "ai-welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages:
            historyPayload.length > 0
              ? historyPayload
              : [{ role: "user", content: promptToSend }],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (language === "vi"
              ? "Không nhận được phản hồi từ AI"
              : "No response from AI"),
        );
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : language === "vi"
            ? "Lỗi kết nối AI"
            : "AI connection error";
      setAiMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: msg,
          createdAt: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetAiChat = () => {
    stopListening();
    setAiMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          language === "vi"
            ? "Đoạn hội thoại đã được làm mới. Tôi có thể hỗ trợ gì thêm cho bạn?"
            : "Conversation has been reset. How else can I assist you?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setAiInput("");
  };

  useEffect(() => {
    if (!policy.chat) {
      setOpen(false);
      setView("options");
    }
  }, [policy.chat]);

  const submitGuestForm = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pageUrl: window.location.href }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi tin nhắn");
      toast.success(language === "vi" ? "Đã gửi tin nhắn đến đội ngũ tư vấn." : "Message sent to our team.");
      setForm({ fullName: "", phone: "", email: "", message: "", privacyConsent: false });
      setView("options");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLiveChat = async (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    
    const content = chatInput.trim();
    setChatInput("");
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: tempId, content, isAdmin: false, createdAt: new Date().toISOString() }
    ]);

    try {
      const response = await fetch("/api/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error("Failed to send");
      }
      lastModifiedRef.current = null;
      triggerImmediatePollRef.current?.();
    } catch (error) {
      toast.error(language === "vi" ? "Lỗi gửi tin nhắn" : "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleOpenDirectMessage = () => {
    if (session?.user) {
      setView("live-chat");
    } else {
      setView("guest-form");
    }
  };

  // Locale-aware: the raw path is `/vi/admin/...`, so strip the prefix first.
  if (stripLocalePrefix(pathname || "/").pathname.startsWith("/admin") || !policy.chat) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 z-50 flex flex-col items-end gap-3 md:right-7 md:bottom-7",
        policy.bottomNavigation ? "bottom-mobile-navigation" : "bottom-5",
      )}
    >
      <AnimatePresence>
        {open && (
          <safeMotion.div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-3xl border border-warm-200 bg-white shadow-2xl flex flex-col h-[480px] max-h-[72dvh] fl-animate-spring overscroll-contain"
          >
            <div className="flex items-center justify-between bg-warm-950 px-5 py-4 text-white shrink-0">
              <div>
                <p className="text-sm font-bold">
                  {view === "ai-chat"
                    ? (language === "vi" ? "Trợ lý AI Maison de FLOF" : "Maison de FLOF AI")
                    : (language === "vi" ? "Maison de FLOF hỗ trợ" : "Maison de FLOF support")}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {view === "ai-chat" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <p className="text-[10px] text-white/55">
                    {view === "live-chat"
                      ? (language === "vi" ? "Trò chuyện trực tiếp" : "Live Chat")
                      : view === "ai-chat"
                      ? (language === "vi" ? "Trực tuyến 24/7" : "Online 24/7")
                      : (language === "vi" ? "Chọn kênh liên hệ phù hợp" : "Choose your preferred contact channel")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {view === "ai-chat" && (
                  <button
                    type="button"
                    onClick={handleResetAiChat}
                    title={language === "vi" ? "Làm mới hội thoại" : "Reset conversation"}
                    className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
                    aria-label="Làm mới chat"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    setView("options");
                  }}
                  className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
                  aria-label="Đóng chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(view === "options" || view === "guest-form") && (
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 flex flex-col bg-jotun-ivory-100"
              >
                {view === "options" && (
                  <div className="grid gap-3">
                    <button
                      onClick={() => setView("ai-chat")}
                      className="flex items-center gap-3 rounded-2xl border border-jotun-teal/30 bg-gradient-to-br from-jotun-teal/15 via-white to-warm-100 p-4 text-left transition hover:border-jotun-teal hover:shadow-sm group"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-jotun-teal text-white shadow-sm transition group-hover:scale-105">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between">
                          <strong className="block text-xs text-warm-900 font-bold">
                            {language === "vi" ? "Trợ lý AI tư vấn" : "FLOF AI Assistant"}
                          </strong>
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                            24/7
                          </span>
                        </span>
                        <span className="text-[10px] text-warm-600 block line-clamp-1 mt-0.5">
                          {language === "vi"
                            ? "Tư vấn màu sơn & sản phẩm Jotun tức thì"
                            : "Instant paint & Jotun color advice"}
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={handleOpenDirectMessage}
                      className="flex items-center gap-3 rounded-2xl border border-warm-200 bg-white p-4 text-left transition hover:border-warm-300 hover:bg-warm-50/50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm-800 text-white">
                        <MessageCircle className="h-5 w-5" />
                      </span>
                      <span>
                        <strong className="block text-xs text-warm-900">
                          {language === "vi" ? "Chat trực tiếp" : "Direct message"}
                        </strong>
                        <span className="text-[10px] text-warm-550 block mt-0.5">
                          {language === "vi"
                            ? "Gửi tin nhắn đến đội ngũ FLOF"
                            : "Send a message to our team"}
                        </span>
                      </span>
                    </button>

                    <a
                      href={messengerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-100/70"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0866ff] text-white">
                        <Facebook className="h-5 w-5" />
                      </span>
                      <span>
                        <strong className="block text-xs text-warm-900">Facebook Messenger</strong>
                        <span className="text-[10px] text-warm-550 block mt-0.5">
                          {language === "vi"
                            ? "Mở cuộc trò chuyện trên Facebook"
                            : "Open a Facebook conversation"}
                        </span>
                      </span>
                    </a>
                  </div>
                )}

                {view === "guest-form" && (
                  <form onSubmit={submitGuestForm} className="space-y-3">
                    <button type="button" onClick={() => setView("options")} className="text-[10px] font-bold text-jotun-teal hover:underline mb-2">
                      ← {language === "vi" ? "Chọn kênh khác" : "Choose another channel"}
                    </button>
                    <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder={language === "vi" ? "Họ và tên *" : "Full name *"} spellCheck={false} autoCorrect="off" className="h-10 w-full rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder={language === "vi" ? "Số điện thoại" : "Phone"} spellCheck={false} autoCorrect="off" className="h-10 min-w-0 rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                      <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" spellCheck={false} autoCorrect="off" className="h-10 min-w-0 rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                    </div>
                    <p className="text-[9px] text-warm-450">{language === "vi" ? "Nhập số điện thoại hoặc email để chúng tôi phản hồi." : "Enter a phone number or email so we can respond."}</p>
                    <textarea required rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder={language === "vi" ? "Bạn cần hỗ trợ điều gì? *" : "How can we help? *"} spellCheck={false} autoCorrect="off" data-gramm="false" className="w-full resize-none rounded-xl border border-warm-200 p-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                    <label className="flex items-start gap-2 text-[10px] leading-4 text-warm-700">
                      <input
                        type="checkbox"
                        required
                        checked={form.privacyConsent}
                        onChange={(event) => setForm({ ...form, privacyConsent: event.target.checked })}
                        className="mt-0.5 h-3.5 w-3.5 accent-jotun-teal"
                      />
                      <span>
                        {language === "vi"
                          ? "Tôi đồng ý để FLOF lưu thông tin liên hệ nhằm phản hồi yêu cầu này."
                          : "I consent to FLOF storing my contact details to answer this request."}
                      </span>
                    </label>
                    <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-950 px-4 py-3 text-xs font-bold text-white hover:bg-warm-850 disabled:opacity-50">
                      <Send className="h-3.5 w-3.5" />
                      {submitting ? (language === "vi" ? "Đang gửi..." : "Sending...") : (language === "vi" ? "Gửi đến quản trị viên" : "Send to administrator")}
                    </button>
                  </form>
                )}
              </div>
            )}

            {view === "ai-chat" && (
              <div className="flex-1 min-h-0 flex flex-col bg-jotun-ivory-100 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-warm-200/60 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setView("options")}
                    className="text-[10px] font-bold text-jotun-teal hover:underline flex items-center gap-1"
                  >
                    ← {language === "vi" ? "Kênh khác" : "Back"}
                  </button>
                  <span className="text-[10px] text-warm-500 font-medium flex items-center gap-1">
                    <Bot className="h-3 w-3 text-jotun-teal" />
                    Maison AI
                  </span>
                </div>

                <div
                  data-lenis-prevent
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3"
                >
                  {aiMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[88%]",
                        msg.role === "user"
                          ? "self-end items-end ml-auto"
                          : "self-start items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed",
                          msg.role === "user"
                            ? "bg-jotun-teal text-white rounded-tr-sm shadow-sm"
                            : msg.isError
                            ? "bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-sm"
                            : "bg-white border border-warm-200 text-warm-900 rounded-tl-sm shadow-sm",
                        )}
                      >
                        <FormattedChatMessage content={msg.content} isUser={msg.role === "user"} />
                      </div>
                      <span className="text-[9px] text-warm-450 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}

                  {/* Quick suggestions when history is short */}
                  {aiMessages.length === 1 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] font-semibold text-warm-500 px-1">
                        {language === "vi" ? "Gợi ý câu hỏi nhanh:" : "Suggested questions:"}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {quickPrompts.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => void handleSendAiMessage(prompt)}
                            className="text-left text-[11px] rounded-xl border border-jotun-teal/20 bg-white px-3 py-2 text-warm-800 hover:border-jotun-teal hover:bg-jotun-teal/5 transition shadow-2xs"
                          >
                            ✨ {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loading typing indicator */}
                  {aiLoading && (
                    <div className="self-start flex items-center gap-1 bg-white border border-warm-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-jotun-teal animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-jotun-teal animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-jotun-teal animate-bounce" />
                      <span className="text-[10px] text-warm-500 ml-1.5">
                        {language === "vi" ? "Đang suy nghĩ..." : "Thinking..."}
                      </span>
                    </div>
                  )}
                  <div ref={aiMessagesEndRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendAiMessage();
                  }}
                  className="shrink-0 p-3 bg-white border-t border-warm-200 flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={
                        isListening
                          ? (language === "vi"
                              ? "Đang lắng nghe giọng nói..."
                              : "Listening to voice...")
                          : (language === "vi"
                              ? "Hỏi trợ lý AI về màu sơn..."
                              : "Ask AI about paint colors...")
                      }
                      disabled={aiLoading}
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                      data-gramm="false"
                      lang="vi"
                      className={cn(
                        "w-full h-10 rounded-xl border pl-3 pr-10 text-xs outline-none transition disabled:opacity-60",
                        isListening
                          ? "border-rose-400 bg-rose-50/40 text-rose-950 ring-2 ring-rose-200/60 placeholder:text-rose-600 font-medium"
                          : "border-warm-200 bg-warm-50/30 text-warm-900 focus:border-jotun-teal",
                      )}
                    />

                    {/* Microphone speech-to-text button embedded inside input (Ulra Movie pattern) */}
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      disabled={aiLoading}
                      title={
                        isListening
                          ? (language === "vi" ? "Dừng ghi âm" : "Stop listening")
                          : (language === "vi" ? "Nói trực tiếp với AI (Micro)" : "Speak with AI (Microphone)")
                      }
                      className={cn(
                        "absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer",
                        isListening
                          ? "bg-rose-500 text-white animate-pulse shadow-sm"
                          : "text-warm-400 hover:text-jotun-teal hover:bg-warm-100 disabled:opacity-40",
                      )}
                      aria-label={
                        isListening
                          ? (language === "vi" ? "Dừng micro" : "Stop microphone")
                          : (language === "vi" ? "Bật micro" : "Start microphone")
                      }
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!aiInput.trim() || aiLoading}
                    className="h-10 w-10 rounded-xl bg-jotun-teal flex items-center justify-center text-white hover:bg-jotun-teal/90 disabled:opacity-40 shrink-0 transition"
                    aria-label="Gửi câu hỏi"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {view === "live-chat" && (
              <div className="flex-1 min-h-0 flex flex-col bg-jotun-ivory-100 overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-warm-200/50 bg-white shrink-0">
                  <button type="button" onClick={() => setView("options")} className="text-[10px] font-bold text-jotun-teal hover:underline">
                    ← {language === "vi" ? "Kênh khác" : "Back"}
                  </button>
                </div>
                
                <div
                  data-lenis-prevent
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <MessageCircle className="h-10 w-10 text-warm-400 mb-2" />
                      <p className="text-xs text-warm-600">
                        {language === "vi" ? "Hãy bắt đầu cuộc trò chuyện. Quản trị viên sẽ phản hồi sớm nhất có thể." : "Start a conversation. An administrator will reply soon."}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.isAdmin ? "self-start items-start" : "self-end items-end ml-auto"}`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] ${msg.isAdmin ? "bg-white border border-warm-200 text-warm-900 rounded-tl-sm" : "bg-jotun-teal text-white rounded-tr-sm"}`}>
                          <FormattedChatMessage content={msg.content} isUser={!msg.isAdmin} />
                        </div>
                        <span className="text-[9px] text-warm-450 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={submitLiveChat} className="shrink-0 p-3 bg-white border-t border-warm-200 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={language === "vi" ? "Nhập tin nhắn..." : "Type a message..."}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    data-gramm="false"
                    lang="vi"
                    className="flex-1 h-10 rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="h-10 w-10 rounded-xl bg-warm-950 flex items-center justify-center text-white hover:bg-warm-850 disabled:opacity-50 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </safeMotion.div>
        )}
      </AnimatePresence>

      <safeMotion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => { setOpen((value) => !value); if (!open) setView("options"); }}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-jotun-teal text-white shadow-[0_8px_25px_rgba(0,123,138,0.35)] ring-2 ring-white/90 md:h-14 md:w-14"
        aria-label={language === "vi" ? "Mở hỗ trợ trực tuyến" : "Open online support"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {!open && <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />}
      </safeMotion.button>
    </div>
  );
}

