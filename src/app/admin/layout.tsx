"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AdminNotificationDropdown } from "@/components/admin/AdminNotificationDropdown";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpenText,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  FolderTree,
  Images,
  Layers3,
  LogOut,
  Menu,
  MessageSquareQuote,
  MessagesSquare,
  PackageOpen,
  Palette,
  ReceiptText,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { cn } from "@/lib/utils";
import { Loader2 } from "@/components/ui/loader-2";

type MenuItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguageStore();
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAuthorized = status === "authenticated" && (role === "ADMIN" || role === "STAFF");

  const menuGroups = useMemo<MenuGroup[]>(
    () => [
      {
        label: language === "vi" ? "Tổng quan" : "Overview",
        items: [
          { name: language === "vi" ? "Bảng điều khiển" : "Dashboard", href: "/admin", icon: BarChart3 },
          { name: language === "vi" ? "Đơn hàng" : "Orders", href: "/admin/orders", icon: ShoppingBag },
          { name: language === "vi" ? "Hóa đơn" : "Invoices", href: "/admin/invoices", icon: ReceiptText },
          { name: language === "vi" ? "Báo giá" : "Quotes", href: "/admin/quotes", icon: MessageSquareQuote },
          { name: language === "vi" ? "Tin nhắn" : "Messages", href: "/admin/chat", icon: MessagesSquare },
        ],
      },
      {
        label: language === "vi" ? "Sản phẩm & kho" : "Catalog & inventory",
        items: [
          { name: language === "vi" ? "Sản phẩm" : "Products", href: "/admin/paints", icon: PackageOpen, adminOnly: true },
          { name: language === "vi" ? "Danh mục & NCC" : "Catalog", href: "/admin/catalog", icon: FolderTree, adminOnly: true },
          { name: language === "vi" ? "Nhập hàng" : "Inventory", href: "/admin/import", icon: Boxes },
          { name: language === "vi" ? "Mã giảm giá" : "Coupons", href: "/admin/coupons", icon: TicketPercent, adminOnly: true },
        ],
      },
      {
        label: language === "vi" ? "Màu sắc & nội dung" : "Colors & content",
        items: [
          { name: language === "vi" ? "Mã màu" : "Colors", href: "/admin/colors", icon: Palette, adminOnly: true },
          { name: language === "vi" ? "Bộ sưu tập màu" : "Collections", href: "/admin/collections", icon: Layers3, adminOnly: true },
          { name: language === "vi" ? "Bài viết" : "Articles", href: "/admin/articles", icon: BookOpenText, adminOnly: true },
          { name: language === "vi" ? "Hình ảnh" : "Media", href: "/admin/images", icon: Images, adminOnly: true },
          { name: language === "vi" ? "Đánh giá" : "Reviews", href: "/admin/reviews", icon: Star },
        ],
      },
      {
        label: language === "vi" ? "Hệ thống" : "System",
        items: [
          { name: language === "vi" ? "Chi nhánh" : "Branches", href: "/admin/dealers", icon: Store, adminOnly: true },
          { name: language === "vi" ? "Tài khoản" : "Accounts", href: "/admin/accounts", icon: Users, adminOnly: true },
        ],
      },
    ],
    [language],
  );

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || role === "ADMIN"),
    }))
    .filter((group) => group.items.length > 0);

  const activeItem = visibleGroups
    .flatMap((group) => group.items)
    .find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href));

  if (status === "loading" || status === "unauthenticated") {
    return <AdminLoader message={language === "vi" ? "Đang xác thực quyền truy cập..." : "Verifying access..."} />;
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-warm-100 px-5">
        <div className="w-full max-w-md rounded-3xl border border-warm-200 bg-white p-8 text-center shadow-sm">
          <CircleUserRound className="mx-auto h-10 w-10 text-warm-450" />
          <h1 className="mt-5 text-xl font-bold text-warm-900">
            {language === "vi" ? "Bạn không có quyền truy cập" : "Access denied"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-warm-600">
            {language === "vi"
              ? "Khu vực này chỉ dành cho nhân viên và quản trị viên."
              : "This area is restricted to staff and administrators."}
          </p>
          <div className="mt-6 grid gap-2">
            <Link href="/" className="rounded-xl bg-warm-900 px-4 py-3 text-xs font-bold text-white hover:bg-warm-800">
              {language === "vi" ? "Quay về cửa hàng" : "Return to storefront"}
            </Link>
            <button onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }} className="rounded-xl border border-warm-200 px-4 py-3 text-xs font-bold text-warm-700 hover:bg-warm-50">
              {language === "vi" ? "Đăng xuất" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex h-[72px] shrink-0 items-center border-b border-white/10", isCollapsed ? "justify-center px-3" : "justify-between px-5")}>
        <Link href="/admin" className={cn("min-w-0", isCollapsed && "hidden")}>
          <span className="block truncate text-base font-bold tracking-tight text-white">Maison de FLOF</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Admin workspace</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white lg:flex"
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="admin-sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!isCollapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "group relative flex h-10 items-center rounded-xl text-xs font-semibold transition-colors",
                      isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                      active ? "bg-white text-warm-950 shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-jotun-teal" : "text-white/45 group-hover:text-white/80")} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className={cn("mb-2 flex items-center rounded-xl bg-white/[0.06] p-2.5", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-jotun-teal text-xs font-bold text-white">
            {(session?.user?.name || session?.user?.email || "A").charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{session?.user?.name || "FLOF Admin"}</p>
              <p className="truncate text-[10px] text-white/60">{role}</p>
            </div>
          )}
        </div>
        <div className={cn("grid gap-1", isCollapsed ? "grid-cols-1" : "grid-cols-2")}>
          <Link href="/" title={language === "vi" ? "Xem cửa hàng" : "View storefront"} className="flex h-9 items-center justify-center gap-2 rounded-xl text-[11px] font-semibold text-white/60 hover:bg-white/10 hover:text-white">
            <Store className="h-4 w-4" />
            {!isCollapsed && <span>{language === "vi" ? "Cửa hàng" : "Store"}</span>}
          </Link>
          <button onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }} title={language === "vi" ? "Đăng xuất" : "Sign out"} className="flex h-9 items-center justify-center gap-2 rounded-xl text-[11px] font-semibold text-white/60 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>{language === "vi" ? "Đăng xuất" : "Sign out"}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex min-h-[100dvh] bg-jotun-ivory-100 text-warm-900">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden bg-warm-950 transition-[width] duration-200 lg:block", isCollapsed ? "w-[76px]" : "w-[248px]")}>
        {sidebar}
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-warm-950/45 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-warm-950 lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", isCollapsed ? "lg:pl-[76px]" : "lg:pl-[248px]")}>
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-warm-250/80 bg-jotun-ivory/95 px-4 backdrop-blur md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-450">
                {language === "vi" ? "Không gian quản trị" : "Admin workspace"}
              </p>
              <h1 className="truncate text-base font-bold text-warm-900">{activeItem?.name || "Admin"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-warm-250 bg-white/80 text-[11px] font-bold text-warm-700 hover:bg-white"
              title={language === "vi" ? "Đổi sang Tiếng Anh" : "Switch to Vietnamese"}
            >
              {language === "vi" ? "EN" : "VI"}
            </button>
            <AdminNotificationDropdown />
            <Link href="/admin/orders" className="hidden h-9 items-center gap-2 rounded-xl border border-warm-250 bg-white/80 px-3 text-[11px] font-bold text-warm-700 hover:bg-white sm:flex">
              <FileText className="h-4 w-4 text-jotun-teal" />
              {language === "vi" ? "Xem đơn hàng" : "View orders"}
            </Link>
            <Link href="/" className="flex h-9 items-center gap-2 rounded-xl bg-warm-950 px-3 text-[11px] font-bold text-white hover:bg-warm-850">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "vi" ? "Cửa hàng" : "Storefront"}</span>
            </Link>
          </div>
        </header>

        <main className="admin-content min-w-0 flex-1 overflow-x-hidden px-4 py-5 md:px-7 md:py-7">
          <div className="mx-auto w-full max-w-[1600px]">
            <motion.div key={pathname} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }}>
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminLoader({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-jotun-ivory-100">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 />
        <p className="text-xs font-semibold text-warm-500">{message}</p>
      </div>
    </div>
  );
}
