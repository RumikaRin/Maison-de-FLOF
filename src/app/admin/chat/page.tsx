"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { CspImage as Image } from "@/components/ui/csp-image";
import { ExternalLink, Mail, MessageCircle, Phone, Send, UserRound } from "lucide-react";
import { toast } from "@/components/ui/csp-toast";
import { CustomSelect } from "@/components/ui/custom-select";
import { useLanguageStore } from "@/store/language-store";

// Old ChatMessage type
type ChatMessage = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  message: string;
  pageUrl: string | null;
  status: "NEW" | "IN_PROGRESS" | "CLOSED";
  adminNote: string | null;
  createdAt: string;
};

// New Live Chat types
type Conversation = {
  id: string;
  userId: string;
  user: { name: string | null; email: string | null; phone: string | null; image: string | null };
  status: "IN_PROGRESS" | "CLOSED" | "NEW";
  messages: Message[];
  updatedAt: string;
};

type Message = {
  id: string;
  content: string;
  isAdmin: boolean;
  isRead: boolean;
  createdAt: string;
};

export default function AdminChatPage() {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<"LIVE" | "GUEST">("LIVE");

  // Guest State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [filter, setFilter] = useState("ALL");

  // Live Chat State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConvDetail, setActiveConvDetail] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Guest Messages
  useEffect(() => {
    if (activeTab !== "GUEST") return;
    setLoadingGuests(true);
    fetch("/api/admin/chat")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải tin nhắn");
        setMessages(data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoadingGuests(false));
  }, [activeTab]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => filter === "ALL" || message.status === filter),
    [filter, messages],
  );

  const updateMessage = async (message: ChatMessage, patch: Partial<ChatMessage>) => {
    const response = await fetch("/api/admin/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...message, ...patch }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể cập nhật tin nhắn");
      return;
    }
    setMessages((current) => current.map((item) => item.id === data.id ? data : item));
    toast.success(language === "vi" ? "Đã cập nhật tin nhắn." : "Message updated.");
  };

  // Fetch Live Conversations (Polling)
  useEffect(() => {
    if (activeTab !== "LIVE") return;
    const fetchConvs = async () => {
      try {
        const response = await fetch("/api/admin/chat/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConvs();
    const interval = setInterval(fetchConvs, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch Active Conversation Details (Polling)
  useEffect(() => {
    if (activeTab !== "LIVE" || !activeConvId) return;
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/admin/chat/conversations/${activeConvId}`);
        if (response.ok) {
          const data = await response.json();
          setActiveConvDetail(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetail();
    const interval = setInterval(fetchDetail, 3000);
    return () => clearInterval(interval);
  }, [activeTab, activeConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (activeConvDetail?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConvDetail?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId) return;

    const content = replyText.trim();
    setReplyText("");

    // Optimistic
    if (activeConvDetail) {
      const tempId = Date.now().toString();
      setActiveConvDetail({
        ...activeConvDetail,
        messages: [...activeConvDetail.messages, { id: tempId, content, isAdmin: true, isRead: true, createdAt: new Date().toISOString() }]
      });
    }

    try {
      const res = await fetch("/api/admin/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, content }),
      });
      if (!res.ok) throw new Error("Failed to reply");
    } catch (err) {
      toast.error(language === "vi" ? "Lỗi gửi tin nhắn" : "Failed to reply");
    }
  };

  return (
    <div className="space-y-6 text-left h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-warm-900">{language === "vi" ? "Tin Nhắn & Hỗ Trợ" : "Messages & Support"}</h1>
          <p className="mt-1 text-xs text-warm-550">{language === "vi" ? "Tiếp nhận tin nhắn và chat trực tiếp với khách hàng." : "Receive messages and chat directly with customers."}</p>
        </div>
        <div className="flex bg-warm-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("LIVE")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "LIVE" ? "bg-white text-jotun-teal shadow-sm" : "text-warm-600 hover:text-warm-900"}`}
          >
            {language === "vi" ? "Live Chat (KH Đăng nhập)" : "Live Chat"}
          </button>
          <button
            onClick={() => setActiveTab("GUEST")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === "GUEST" ? "bg-white text-warm-900 shadow-sm" : "text-warm-600 hover:text-warm-900"}`}
          >
            {language === "vi" ? "Tin nhắn Khách vãng lai" : "Guest Messages"}
          </button>
        </div>
      </div>

      {activeTab === "LIVE" ? (
        <div className="flex flex-1 min-h-0 bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Sidebar */}
          <div className="w-80 border-r border-warm-200 flex flex-col bg-warm-50/30">
            <div className="p-4 border-b border-warm-200 bg-white shrink-0">
              <h3 className="font-bold text-sm text-warm-900">{language === "vi" ? "Danh sách chat" : "Conversations"}</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-warm-500">
                  {language === "vi" ? "Chưa có hội thoại nào." : "No conversations yet."}
                </div>
              ) : (
                <div className="divide-y divide-warm-100">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-4 hover:bg-white transition-colors flex gap-3 ${activeConvId === conv.id ? "bg-white border-l-2 border-l-jotun-teal" : "border-l-2 border-l-transparent"}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-warm-200 shrink-0 flex items-center justify-center text-warm-600 overflow-hidden">
                        {conv.user.image ? (
                          <Image
                            src={conv.user.image}
                            alt={conv.user.name || ""}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-warm-900 truncate">{conv.user.name || conv.user.email || "Khách hàng"}</p>
                          <span className="text-[9px] text-warm-450">{new Date(conv.updatedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11px] text-warm-550 truncate">
                          {conv.messages[0]?.isAdmin ? "Bạn: " : ""}
                          {conv.messages[0]?.content || "Bắt đầu hội thoại mới"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          {activeConvId && activeConvDetail ? (
            <div className="flex-1 flex flex-col bg-jotun-ivory-100/50">
              <div className="p-4 border-b border-warm-200 bg-white shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warm-200 shrink-0 flex items-center justify-center text-warm-600 overflow-hidden">
                    {activeConvDetail.user.image ? (
                      <Image
                        src={activeConvDetail.user.image}
                        alt={activeConvDetail.user.name || ""}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-warm-900">{activeConvDetail.user.name || "Khách hàng"}</h3>
                    <p className="text-[11px] text-warm-500">
                      {activeConvDetail.user.email} {activeConvDetail.user.phone ? `• ${activeConvDetail.user.phone}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeConvDetail.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col max-w-[75%] ${msg.isAdmin ? "self-end items-end ml-auto" : "self-start items-start"}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm ${msg.isAdmin ? "bg-warm-900 text-white rounded-tr-sm" : "bg-white border border-warm-200 text-warm-900 rounded-tl-sm shadow-sm"}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-warm-450 mt-1.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-warm-200 shrink-0">
                <form onSubmit={handleSendReply} className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={language === "vi" ? "Nhập phản hồi..." : "Type reply..."}
                    className="flex-1 h-12 rounded-xl border border-warm-200 px-4 text-sm outline-none focus:border-jotun-teal bg-warm-50/50"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="h-12 px-6 rounded-xl bg-jotun-teal flex items-center justify-center text-white font-bold text-sm hover:bg-jotun-teal-600 disabled:opacity-50 shrink-0 transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {language === "vi" ? "Gửi" : "Send"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-jotun-ivory-100/30">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-warm-500">{language === "vi" ? "Chọn một hội thoại để xem" : "Select a conversation to view"}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-end mb-4 w-full sm:w-52 ml-auto">
            <CustomSelect value={filter} onValueChange={setFilter} options={[
              { value: "ALL", label: language === "vi" ? "Tất cả tin nhắn" : "All messages" },
              { value: "NEW", label: language === "vi" ? "Tin mới" : "New" },
              { value: "IN_PROGRESS", label: language === "vi" ? "Đang xử lý" : "In progress" },
              { value: "CLOSED", label: language === "vi" ? "Đã đóng" : "Closed" },
            ]} />
          </div>
          {loadingGuests ? (
            <div className="rounded-2xl border border-warm-200 bg-white p-10 text-center text-xs text-warm-500">Loading...</div>
          ) : (
            <div className="grid gap-4">
              {visibleMessages.map((message) => (
                <article key={message.id} className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-jotun-teal" />
                        <h2 className="font-bold text-warm-900">{message.fullName}</h2>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${message.status === "NEW" ? "bg-emerald-50 text-emerald-600" : message.status === "CLOSED" ? "bg-warm-100 text-warm-500" : "bg-amber-50 text-amber-600"}`}>{message.status}</span>
                        <span className="text-[10px] text-warm-450">{new Date(message.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-warm-600">
                        {message.phone && <a href={`tel:${message.phone}`} className="flex items-center gap-1 hover:text-jotun-teal"><Phone className="h-3 w-3" />{message.phone}</a>}
                        {message.email && <a href={`mailto:${message.email}`} className="flex items-center gap-1 hover:text-jotun-teal"><Mail className="h-3 w-3" />{message.email}</a>}
                        {message.pageUrl && <a href={message.pageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-jotun-teal"><ExternalLink className="h-3 w-3" />Trang khách gửi</a>}
                      </div>
                      <p className="mt-4 whitespace-pre-wrap rounded-xl bg-warm-50 p-4 text-sm leading-relaxed text-warm-750">{message.message}</p>
                    </div>
                    <div className="w-full shrink-0 space-y-3 lg:w-72">
                      <CustomSelect value={message.status} onValueChange={(status) => updateMessage(message, { status: status as ChatMessage["status"] })} options={[
                        { value: "NEW", label: language === "vi" ? "Tin mới" : "New" },
                        { value: "IN_PROGRESS", label: language === "vi" ? "Đang xử lý" : "In progress" },
                        { value: "CLOSED", label: language === "vi" ? "Đã đóng" : "Closed" },
                      ]} />
                      <textarea rows={4} value={message.adminNote || ""} onChange={(event) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, adminNote: event.target.value } : item))} placeholder={language === "vi" ? "Ghi chú xử lý nội bộ..." : "Internal processing note..."} className="w-full rounded-xl border border-warm-200 p-3 text-xs outline-none focus:border-jotun-teal" />
                      <button onClick={() => updateMessage(message, {})} className="w-full rounded-xl bg-warm-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-warm-850">{language === "vi" ? "Lưu ghi chú" : "Save note"}</button>
                    </div>
                  </div>
                </article>
              ))}
              {visibleMessages.length === 0 && <div className="rounded-2xl border border-warm-200 bg-white p-10 text-center text-xs text-warm-500">{language === "vi" ? "Chưa có tin nhắn phù hợp." : "No matching messages."}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

