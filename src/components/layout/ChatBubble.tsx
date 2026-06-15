"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Facebook, MessageCircle, Send, X, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useLanguageStore } from "@/store/language-store";
import { useSession } from "next-auth/react";

const messengerUrl = process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/maisondeflof";

type Message = {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
};

export function ChatBubble() {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  
  // View states: 'options' | 'guest-form' | 'live-chat'
  const [view, setView] = useState<"options" | "guest-form" | "live-chat">("options");
  
  // Guest Form State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", message: "" });
  
  // Live Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling for live chat messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (open && view === "live-chat" && session?.user) {
      const fetchMessages = async () => {
        try {
          const res = await fetch("/api/chat/conversation");
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      };
      
      fetchMessages();
      interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [open, view, session?.user]);

  // Auto scroll to bottom in live chat
  useEffect(() => {
    if (view === "live-chat" && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

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
      setForm({ fullName: "", phone: "", email: "", message: "" });
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

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-5 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-3xl border border-warm-200 bg-white shadow-2xl flex flex-col h-[480px] max-h-[80vh]"
          >
            <div className="flex items-center justify-between bg-warm-950 px-5 py-4 text-white shrink-0">
              <div>
                <p className="text-sm font-bold">{language === "vi" ? "Maison de FLOF hỗ trợ" : "Maison de FLOF support"}</p>
                <p className="mt-0.5 text-[10px] text-white/55">
                  {view === "live-chat" 
                    ? (language === "vi" ? "Trò chuyện trực tiếp" : "Live Chat")
                    : (language === "vi" ? "Chọn kênh liên hệ phù hợp" : "Choose your preferred contact channel")}
                </p>
              </div>
              <button onClick={() => { setOpen(false); setView("options"); }} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Đóng chat">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-jotun-ivory-100">
              {view === "options" && (
                <div className="grid gap-3">
                  <a href={messengerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:border-blue-200 hover:bg-blue-100/70">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0866ff] text-white"><Facebook className="h-5 w-5" /></span>
                    <span>
                      <strong className="block text-xs text-warm-900">Facebook Messenger</strong>
                      <span className="text-[10px] text-warm-550">{language === "vi" ? "Mở cuộc trò chuyện trên Facebook" : "Open a Facebook conversation"}</span>
                    </span>
                  </a>
                  <button onClick={handleOpenDirectMessage} className="flex items-center gap-3 rounded-2xl border border-jotun-teal/15 bg-jotun-teal/5 p-4 text-left transition hover:border-jotun-teal/30 hover:bg-jotun-teal/10">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-jotun-teal text-white"><MessageCircle className="h-5 w-5" /></span>
                    <span>
                      <strong className="block text-xs text-warm-900">{language === "vi" ? "Chat trực tiếp" : "Direct message"}</strong>
                      <span className="text-[10px] text-warm-550">{language === "vi" ? "Gửi tin nhắn đến quản trị viên" : "Send a message to an administrator"}</span>
                    </span>
                  </button>
                </div>
              )}

              {view === "guest-form" && (
                <form onSubmit={submitGuestForm} className="space-y-3">
                  <button type="button" onClick={() => setView("options")} className="text-[10px] font-bold text-jotun-teal hover:underline mb-2">
                    ← {language === "vi" ? "Chọn kênh khác" : "Choose another channel"}
                  </button>
                  <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder={language === "vi" ? "Họ và tên *" : "Full name *"} className="h-10 w-full rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder={language === "vi" ? "Số điện thoại" : "Phone"} className="h-10 min-w-0 rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="h-10 min-w-0 rounded-xl border border-warm-200 px-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                  </div>
                  <p className="text-[9px] text-warm-450">{language === "vi" ? "Nhập số điện thoại hoặc email để chúng tôi phản hồi." : "Enter a phone number or email so we can respond."}</p>
                  <textarea required rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder={language === "vi" ? "Bạn cần hỗ trợ điều gì? *" : "How can we help? *"} className="w-full resize-none rounded-xl border border-warm-200 p-3 text-xs outline-none focus:border-jotun-teal bg-white" />
                  <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-950 px-4 py-3 text-xs font-bold text-white hover:bg-warm-850 disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" />
                    {submitting ? (language === "vi" ? "Đang gửi..." : "Sending...") : (language === "vi" ? "Gửi đến quản trị viên" : "Send to administrator")}
                  </button>
                </form>
              )}

              {view === "live-chat" && (
                <div className="flex flex-col h-full -m-4">
                  <div className="flex items-center gap-2 p-3 border-b border-warm-200/50 bg-white shrink-0">
                    <button type="button" onClick={() => setView("options")} className="text-[10px] font-bold text-jotun-teal hover:underline">
                      ← {language === "vi" ? "Kênh khác" : "Back"}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-warm-400 mt-1 px-1">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => { setOpen((value) => !value); if (!open) setView("options"); }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-jotun-teal text-white shadow-[0_12px_35px_rgba(0,123,138,0.35)] ring-4 ring-white/80"
        aria-label={language === "vi" ? "Mở hỗ trợ trực tuyến" : "Open online support"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {!open && <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />}
      </motion.button>
    </div>
  );
}
