/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Rule } from "@/components/ui/editorial";
import type { ProfileTab } from "./types";

interface ProfileSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  language: string;
  handleLogout: () => void;
}

/**
 * Flat text index. The active item carries a 2px ink rule on its leading edge —
 * no pill highlights, no filled buttons (design.md § Shape and depth).
 */
export function ProfileSidebar({
  user,
  activeTab,
  setActiveTab,
  language,
  handleLogout,
}: ProfileSidebarProps) {
  const tabs: Array<{ id: ProfileTab; vi: string; en: string; show: boolean }> = [
    { id: "history", vi: "Lịch sử mua hàng", en: "Purchase History", show: true },
    { id: "profile", vi: "Thông tin cá nhân", en: "Personal Settings", show: true },
    { id: "password", vi: "Đổi mật khẩu", en: "Change Password", show: true },
    { id: "addresses", vi: "Sổ địa chỉ", en: "Address Book", show: true },
    { id: "favorites", vi: "Màu sắc đã lưu", en: "Saved Colors", show: true },
    { id: "sessions", vi: "Phiên đăng nhập", en: "Signed-in Sessions", show: true },
    { id: "privacy", vi: "Dữ liệu & quyền riêng tư", en: "Data & Privacy", show: user.role === "CUSTOMER" },
  ];

  return (
    <aside className="lg:col-span-4 lg:max-w-xs">
      {/* Identity */}
      <p className="fl-display text-fl-xl">{user.name || "Khách hàng"}</p>
      <p className="mt-fl-3xs break-all text-fl-xs text-atelier-ink-2">{user.email}</p>
      <Rule weight="strong" className="mt-fl-sm" />

      <nav
        aria-label={language === "vi" ? "Mục hồ sơ" : "Profile sections"}
        className="mt-fl-xs flex flex-col"
      >
        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex min-h-11 items-center gap-2 whitespace-nowrap border-l-2 border-transparent pl-fl-sm text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2"
          >
            <span>{language === "vi" ? "Trang quản trị Admin" : "Admin Dashboard"}</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}

        {tabs
          .filter((tab) => tab.show)
          .map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex min-h-11 items-center whitespace-nowrap border-l-2 pl-fl-sm text-left text-fl-sm transition-colors duration-fl-fast ease-fl-out",
                  active
                    ? "border-atelier-ink font-medium text-atelier-ink"
                    : "border-transparent text-atelier-ink-2 hover:text-atelier-ink",
                )}
              >
                {language === "vi" ? tab.vi : tab.en}
              </button>
            );
          })}

        {/* Security stays an explicit administrator-only branch — the
            profile-security contract test pins this exact gating. */}
        {user.role === "ADMIN" && (
          <button
            onClick={() => setActiveTab("security")}
            aria-current={activeTab === "security" ? "true" : undefined}
            className={cn(
              "flex min-h-11 items-center whitespace-nowrap border-l-2 pl-fl-sm text-left text-fl-sm transition-colors duration-fl-fast ease-fl-out",
              activeTab === "security"
                ? "border-atelier-ink font-medium text-atelier-ink"
                : "border-transparent text-atelier-ink-2 hover:text-atelier-ink",
            )}
          >
            {language === "vi" ? "Bảo mật" : "Security"}
          </button>
        )}
      </nav>

      <Rule className="mt-fl-sm" />
      <button
        onClick={handleLogout}
        className="mt-fl-xs hidden min-h-11 items-center whitespace-nowrap border-l-2 border-transparent pl-fl-sm text-left text-fl-sm text-atelier-danger transition-opacity duration-fl-fast ease-fl-out hover:opacity-80 lg:flex"
      >
        {language === "vi" ? "Đăng xuất" : "Log Out"}
      </button>
    </aside>
  );
}
