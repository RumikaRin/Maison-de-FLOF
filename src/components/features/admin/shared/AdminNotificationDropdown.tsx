"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { ComponentType } from "react";
import { Bell, Check, Package, FileText, MessageCircle, Star, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { useLanguageStore } from "@/store/language-store";
import { cn } from "@/lib/utils";
import {
  createNotificationPoller,
  notificationPollHeaders,
} from "@/lib/notifications/polling";
import { useLocaleNavigation } from "@/hooks/use-locale-navigation";

type NotificationType = "ORDER" | "STOCK" | "QUOTE" | "SYSTEM" | "REVIEW";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TABS: {
  id: "ALL" | NotificationType;
  labelVi: string;
  labelEn: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "ALL", labelVi: "Tất cả", labelEn: "All", icon: Bell },
  { id: "ORDER", labelVi: "Đơn hàng", labelEn: "Orders", icon: Package },
  { id: "SYSTEM", labelVi: "Trò chuyện", labelEn: "Chats", icon: MessageCircle },
  { id: "QUOTE", labelVi: "Báo giá", labelEn: "Quotes", icon: FileText },
  { id: "REVIEW", labelVi: "Đánh giá", labelEn: "Reviews", icon: Star },
  { id: "STOCK", labelVi: "Tồn kho", labelEn: "Stock", icon: AlertTriangle },
];

export function AdminNotificationDropdown() {
  const { language } = useLanguageStore();
  const router = useRouter();
  const { localize } = useLocaleNavigation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | NotificationType>("ALL");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const etagRef = useRef<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch(
      `/api/admin/notifications?type=${activeTab}&limit=20`,
      { headers: notificationPollHeaders(etagRef.current) },
    );
    if (res.status === 304) return;
    if (!res.ok) {
      throw new Error(`Notification polling failed with status ${res.status}`);
    }
    etagRef.current = res.headers.get("etag");
    const data = (await res.json()) as {
      notifications: Notification[];
      unreadCount: number;
    };
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, [activeTab]);

  useEffect(() => {
    etagRef.current = null;
    const poller = createNotificationPoller({ poll: fetchNotifications });
    const syncActivity = () => {
      poller.setActive(
        document.visibilityState === "visible" && navigator.onLine,
      );
    };
    document.addEventListener("visibilitychange", syncActivity);
    window.addEventListener("online", syncActivity);
    window.addEventListener("offline", syncActivity);
    syncActivity();
    poller.start();
    return () => {
      document.removeEventListener("visibilitychange", syncActivity);
      window.removeEventListener("online", syncActivity);
      window.removeEventListener("offline", syncActivity);
      poller.stop();
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications/mark-all-read", { method: "POST" });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await fetch(`/api/admin/notifications/${notification.id}/read`, { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    setOpen(false);
    
    // Redirect based on type
    switch (notification.type) {
      case "ORDER":
        router.push(localize("/admin/orders"));
        break;
      case "QUOTE":
        router.push(localize("/admin/quotes"));
        break;
      case "SYSTEM":
        router.push(localize("/admin/chat"));
        break;
      case "REVIEW":
        router.push(localize("/admin/reviews"));
        break;
      case "STOCK":
        router.push(localize("/admin/paints"));
        break;
      default:
        break;
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "ORDER": return <Package className="h-4 w-4 text-blue-500" />;
      case "QUOTE": return <FileText className="h-4 w-4 text-purple-500" />;
      case "SYSTEM": return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      case "REVIEW": return <Star className="h-4 w-4 text-amber-500" />;
      case "STOCK": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-warm-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={language === "vi" ? "Mở thông báo" : "Open notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-warm-250 bg-white/80 text-warm-700 hover:bg-white transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <safeMotion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-warm-200 bg-white shadow-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-warm-100 bg-warm-50/50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-warm-900 text-sm">{language === "vi" ? "Thông báo" : "Notifications"}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-jotun-teal hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  {language === "vi" ? "Đánh dấu đã đọc" : "Mark all as read"}
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-warm-100 shrink-0 px-2 py-1 gap-1 bg-white">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors shrink-0",
                    activeTab === tab.id
                      ? "bg-warm-100 text-warm-900"
                      : "text-warm-500 hover:bg-warm-50 hover:text-warm-700"
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  {language === "vi" ? tab.labelVi : tab.labelEn}
                </button>
              ))}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <Bell className="h-8 w-8 text-warm-200 mb-2" />
                  <p className="text-xs font-medium text-warm-500">
                    {language === "vi" ? "Không có thông báo nào" : "No notifications"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-warm-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-warm-50 transition-colors flex gap-3 items-start",
                        !notification.isRead ? "bg-blue-50/30" : "bg-white"
                      )}
                    >
                      <div className="shrink-0 mt-0.5 p-2 bg-warm-100 rounded-full">
                        {getIconForType(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={cn("text-xs leading-tight pr-2", !notification.isRead ? "font-bold text-warm-900" : "font-semibold text-warm-700")}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-0.5" />}
                        </div>
                        <p className={cn("text-[11px] leading-snug line-clamp-2", !notification.isRead ? "text-warm-700" : "text-warm-500")}>
                          {notification.message}
                        </p>
                        <span className="text-[9px] text-warm-400 mt-1.5 block">
                          {new Date(notification.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit"
                          })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-warm-100 bg-warm-50 text-center shrink-0">
              <span className="text-[9px] text-warm-400">
                {language === "vi"
                  ? "Tự dừng khi ẩn hoặc mất mạng"
                  : "Pauses while hidden or offline"}
              </span>
            </div>
          </safeMotion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

