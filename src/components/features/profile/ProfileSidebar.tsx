"use client";

import Link from "next/link";
import { safeMotion } from "@/components/ui/motion-safe";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  activeTab: string;
  setActiveTab: (tab: any) => void;
  language: string;
  handleLogout: () => void;
}

export function ProfileSidebar({
  user,
  activeTab,
  setActiveTab,
  language,
  handleLogout,
}: ProfileSidebarProps) {
  return (
    <safeMotion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="lg:col-span-4 bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col gap-4 sm:gap-6"
    >
      <div className="flex items-center gap-4 border-b border-warm-100 pb-4 sm:pb-5">
        <div className="h-14 w-14 bg-jotun-teal/10 text-jotun-teal rounded-full flex items-center justify-center font-bold text-lg border border-jotun-teal/20 shadow-sm shrink-0">
          {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
        </div>
        <div className="text-left">
          <h2 className="font-serif font-bold text-lg text-warm-900 leading-tight">{user.name || "Khách hàng"}</h2>
          <span className="text-xs text-warm-500 block font-mono mt-0.5">{user.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 lg:gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-full">
        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center justify-between px-3.5 py-2.5 lg:p-3 rounded-xl hover:bg-warm-900 hover:text-white text-warm-900 border border-warm-200 transition-all bg-warm-50/50 lg:mb-2 shadow-sm focus:outline-none col-span-2 lg:col-span-1 text-center justify-center lg:justify-between"
          >
            <span>{language === "vi" ? "Trang quản trị Admin" : "Admin Dashboard"}</span>
            <span className="hidden lg:inline">→</span>
          </Link>
        )}

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
            activeTab === "history"
              ? "bg-warm-900 text-white shadow-sm"
              : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
          )}
        >
          <span>{language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
            activeTab === "profile"
              ? "bg-warm-900 text-white shadow-sm"
              : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
          )}
        >
          <span>{language === "vi" ? "Thông tin cá nhân" : "Personal Settings"}</span>
        </button>

        <button
          onClick={() => setActiveTab("password")}
          className={cn(
            "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
            activeTab === "password"
              ? "bg-warm-900 text-white shadow-sm"
              : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
          )}
        >
          <span>{language === "vi" ? "Đổi mật khẩu" : "Change Password"}</span>
        </button>

        <button
          onClick={() => setActiveTab("addresses")}
          className={cn(
            "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
            activeTab === "addresses"
              ? "bg-warm-900 text-white shadow-sm"
              : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
          )}
        >
          <span>{language === "vi" ? "Sổ địa chỉ" : "Address Book"}</span>
        </button>

        <button
          onClick={() => setActiveTab("favorites")}
          className={cn(
            "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-2 lg:col-span-1",
            activeTab === "favorites"
              ? "bg-warm-900 text-white shadow-sm"
              : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
          )}
        >
          <span>{language === "vi" ? "Màu sắc đã lưu" : "Saved Colors"}</span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={cn(
            "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-2 lg:col-span-1",
            activeTab === "sessions"
              ? "bg-warm-900 text-white shadow-sm"
              : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
          )}
        >
          <span>{language === "vi" ? "Phiên đăng nhập" : "Signed-in Sessions"}</span>
        </button>

        <button
          onClick={handleLogout}
          className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 lg:p-3 rounded-xl text-red-600 hover:bg-red-500/10 text-left transition-colors duration-200 lg:mt-4 border border-red-500/10 bg-red-500/[0.02] shrink-0 whitespace-nowrap focus:outline-none"
        >
          <span>{language === "vi" ? "Đăng xuất" : "Log Out"}</span>
        </button>
      </div>
    </safeMotion.aside>
  );
}

