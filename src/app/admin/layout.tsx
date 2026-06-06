"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguageStore();

  const [authorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("sonvn-user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === "ADMIN") {
        setAuthorized(true);
      } else {
        router.push("/");
        toast.error(
          language === "vi"
            ? "Tài khoản của bạn không có quyền truy cập quản trị!"
            : "Your account does not have admin permissions!"
        );
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router, language]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-jotun-ivory flex items-center justify-center">
        <div className="animate-pulse font-serif text-warm-550 text-sm">
          {language === "vi" ? "Đang xác thực quyền truy cập..." : "Verifying access permissions..."}
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      name: language === "vi" ? "Thống kê chính" : "Dashboard",
      href: "/admin",
    },
    {
      name: language === "vi" ? "Đơn hàng" : "Orders",
      href: "/admin/orders",
    },
    {
      name: language === "vi" ? "Sản phẩm" : "Products",
      href: "/admin/paints",
    },
    {
      name: language === "vi" ? "Mã màu" : "Colors",
      href: "/admin/colors",
    },
    {
      name: language === "vi" ? "Tài khoản" : "Accounts",
      href: "/admin/accounts",
    },
    {
      name: language === "vi" ? "Bài viết" : "Articles",
      href: "/admin/articles",
    },
    {
      name: language === "vi" ? "Chi nhánh" : "Branches",
      href: "/admin/dealers",
    }
  ];

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white text-warm-900 px-6 py-4 flex items-center justify-between border-b border-warm-200/80">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold tracking-tight text-warm-900">FLOF Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-xs font-bold uppercase tracking-wider text-jotun-teal hover:text-warm-850 px-2 py-1"
        >
          {isSidebarOpen ? (language === "vi" ? "[Đóng]" : "[Close]") : "[Menu]"}
        </button>
      </header>

      {/* Sidebar Panel */}
      <aside
        className={`bg-white text-warm-900 w-full md:w-64 shrink-0 flex flex-col justify-between py-8 px-6 border-r border-warm-200/80 transition-all duration-300 md:block ${
          isSidebarOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-2 border-b border-warm-100 pb-5">
            <div className="text-left">
              <span className="font-serif font-bold text-lg tracking-tight block text-warm-900">FLOF Admin</span>
              <span className="text-[10px] text-warm-400 font-mono tracking-widest uppercase font-bold">MANAGEMENT</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-warm-900 text-white shadow-sm"
                      : "text-warm-700 hover:bg-warm-100 hover:text-warm-900"
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && <span className="text-[10px] font-mono">●</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to storefront link */}
        <div className="pt-6 border-t border-warm-100 mt-6 md:mt-0">
          <Link
            href="/"
            className="flex items-center justify-between text-warm-750 hover:bg-warm-100 hover:text-warm-900 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all duration-300"
          >
            <span>{language === "vi" ? "Xem Cửa Hàng" : "View Storefront"}</span>
            <span>→</span>
          </Link>
        </div>
      </aside>

      {/* Right Content Column (Top Header + Main Content) */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex items-center justify-end px-10 py-4 border-b border-warm-200/80 bg-white shadow-xs">
          <div className="flex items-center gap-3 bg-warm-50/50 p-2 px-4 rounded-xl border border-warm-150">
            <div className="h-8 w-8 bg-jotun-teal text-white rounded-full flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block text-warm-850">
                {language === "vi" ? "Quản Trị Viên" : "Administrator"}
              </span>
              <span className="text-[9px] text-warm-500 font-mono font-bold uppercase tracking-wider">
                ADMIN ROLE
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
