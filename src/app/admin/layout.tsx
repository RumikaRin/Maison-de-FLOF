"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguageStore();
  const { data: session, status } = useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isAuthorized = status === "authenticated" && (session.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !isAuthorized) {
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
    <div className="h-screen bg-jotun-ivory text-warm-900 flex flex-col md:flex-row antialiased overflow-hidden">
      {/* Mobile header */}
      <header className="md:hidden bg-white text-warm-900 px-6 py-4 flex items-center justify-between border-b border-warm-200/80 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold tracking-tight text-warm-900">FLOF Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[10px] font-bold uppercase tracking-wider text-warm-500 hover:text-warm-850 transition-colors"
          >
            {language === "vi" ? "Đăng xuất" : "Logout"}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-xs font-bold uppercase tracking-wider text-jotun-teal hover:text-warm-850 px-2 py-1 transition-colors"
          >
            {isSidebarOpen ? (language === "vi" ? "[Đóng]" : "[Close]") : "[Menu]"}
          </button>
        </div>
      </header>

      {/* Sidebar — sticky, fixed height, independent scroll */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? "256px" : "0px",
          paddingLeft: isSidebarOpen ? "24px" : "0px",
          paddingRight: isSidebarOpen ? "24px" : "0px",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white text-warm-900 shrink-0 flex-col justify-between py-8 border-r border-warm-200/80 md:flex overflow-hidden h-full sticky top-0"
      >
        <div className="flex flex-col gap-8 h-full overflow-y-auto">
          <div className="flex flex-col gap-8 flex-1">
            <div className="hidden md:flex items-center gap-2 border-b border-warm-100 pb-5">
              <div className="text-left">
                <span className="font-serif font-bold text-lg tracking-tight block text-warm-900">FLOF Admin</span>
                <span className="text-[10px] text-warm-400 font-mono tracking-widest uppercase font-bold">MANAGEMENT</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-warm-700 hover:bg-warm-100 hover:text-warm-900"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAdminTab"
                        className="absolute inset-0 bg-warm-900 rounded-xl z-0"
                        transition={{ type: "spring", stiffness: 600, damping: 42 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                    {isActive && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="text-[10px] font-mono relative z-10"
                      >
                        ●
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
 
          <div className="pt-6 border-t border-warm-100 shrink-0 flex flex-col gap-1.5">
            <Link
              href="/"
              className="flex items-center justify-between text-warm-700 hover:bg-warm-100 hover:text-warm-900 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-colors duration-300"
            >
              <span>{language === "vi" ? "Xem Cửa Hàng" : "View Storefront"}</span>
              <span>→</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-between text-warm-700 hover:bg-warm-100 hover:text-warm-900 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-colors duration-300"
            >
              <span>{language === "vi" ? "Đăng xuất" : "Logout"}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </motion.aside>
 
      {/* Main content — independent scroll */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
        <main className="flex-grow p-6 md:p-10 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto w-full">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
