"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Bell, ShoppingBag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";
import { Loader2 } from "@/components/ui/loader-2";

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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOrders, setMobileOrders] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const loadOrders = () => {
      const stored = localStorage.getItem("sonvn-orders");
      if (stored) {
        try {
          setMobileOrders(JSON.parse(stored));
        } catch (e) {}
      } else {
        const defaultOrders = [
          { id: "SVN-992018", date: "2026-06-04", userEmail: "b2b-builder@gmail.com", customer: "Nhà thầu VietCons", items: "Sơn ngoại thất Jotashield cực bền 100L", total: 108000000, status: "COMPLETED" },
          { id: "SVN-839201", date: "2026-06-04", userEmail: "customer1@sonvn.com", customer: "Trần Thế Hưng", items: "Jotun Majestic 5L x 2, Trắng Ngà (1001)", total: 2850000, status: "COMPLETED" },
          { id: "SVN-193021", date: "2026-05-18", userEmail: "customer1@sonvn.com", customer: "Lê Hoàng Yến", items: "Dulux Weathershield 5L x 1, Xám Bạc (3002)", total: 1280000, status: "COMPLETED" },
          { id: "SVN-482019", date: "2026-06-03", userEmail: "customer2@sonvn.com", customer: "Nguyễn Minh Đức", items: "Sơn lót chống kiềm Majestic 5L x 1", total: 950000, status: "PENDING" }
        ];
        localStorage.setItem("sonvn-orders", JSON.stringify(defaultOrders));
        setMobileOrders(defaultOrders);
      }
    };

    loadOrders();
    window.addEventListener("storage", loadOrders);
    return () => window.removeEventListener("storage", loadOrders);
  }, [isMobile]);

  const isAuthorized = status === "authenticated" && (session.user as any)?.role === "ADMIN";

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] bg-jotun-ivory text-warm-900 flex flex-col items-center justify-center px-6 text-center gap-6 fullscreen-loader">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
        <div className="z-10 flex flex-col items-center gap-4">
          <Loader2 />
          <p className="text-[11px] font-mono uppercase tracking-wider text-warm-450 animate-pulse">
            {language === "vi" ? "Đang xác thực quyền truy cập..." : "Verifying access permissions..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && !isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-jotun-ivory text-warm-900 flex flex-col items-center justify-center px-6 py-20 text-center gap-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="relative max-w-md w-full bg-white border border-warm-300 rounded-[2rem] p-8 sm:p-12 shadow-xl flex flex-col items-center gap-6 z-10"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 text-2xl border border-amber-500/20 shadow-xs">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-warm-900 leading-tight">
              {language === "vi" ? "Bạn không có quyền truy cập" : "Access Denied"}
            </h2>
            <p className="text-xs sm:text-sm text-warm-550 leading-relaxed font-light">
              {language === "vi"
                ? "Tài khoản của bạn không được cấp quyền quản trị viên. Vui lòng quay lại trang chủ hoặc đăng nhập bằng tài khoản admin."
                : "Your account does not have admin permissions. Please return to the homepage or login with an admin account."}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/"
              className="w-full py-3 bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center"
            >
              {language === "vi" ? "Quay về trang chủ" : "Return to Homepage"}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-3 border border-warm-300 hover:bg-warm-50 text-warm-700 text-xs font-bold rounded-2xl transition-all active:scale-98"
            >
              {language === "vi" ? "Đăng xuất & Đăng nhập lại" : "Sign out & Login again"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="fixed inset-0 z-[9999] bg-jotun-ivory text-warm-900 flex flex-col items-center justify-center px-6 text-center gap-6 fullscreen-loader">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
        <div className="z-10 flex flex-col items-center gap-4">
          <Loader2 />
          <p className="text-[11px] font-mono uppercase tracking-wider text-warm-450 animate-pulse">
            {language === "vi" ? "Đang chuyển hướng đăng nhập..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    const updated = mobileOrders.map((ord) => {
      if (ord.id === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    setMobileOrders(updated);
    localStorage.setItem("sonvn-orders", JSON.stringify(updated));
    toast.success(
      language === "vi"
        ? `Đã cập nhật trạng thái đơn hàng thành ${newStatus === "COMPLETED" ? "Hoàn thành" : newStatus === "PROCESSING" ? "Đang giao" : newStatus === "PENDING" ? "Chờ duyệt" : "Đã hủy"}!`
        : `Order status updated to ${newStatus}!`
    );
  };

  const handleConfirmOrder = (orderId: string) => {
    handleUpdateStatus(orderId, "COMPLETED");
  };

  if (isMobile) {
    const pendingOrders = mobileOrders.filter((o) => o.status === "PENDING");
    const otherOrders = mobileOrders.filter((o) => o.status !== "PENDING");

    return (
      <div className="min-h-screen bg-jotun-ivory text-warm-900 flex flex-col font-sans antialiased">
        {/* Mobile Header */}
        <header className="bg-white border-b border-warm-200/80 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-warm-900">FLOF Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-warm-700 bg-warm-50 border border-warm-200 px-3 py-1.5 rounded-xl hover:bg-warm-100 transition-colors"
            >
              {language === "vi" ? "Xem cửa hàng" : "Storefront"}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
            >
              {language === "vi" ? "Đăng xuất" : "Logout"}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow p-5 flex flex-col gap-6 overflow-y-auto">
          {/* Desktop Warning Banner */}
          <div className="bg-[#FAF8F2] border border-[#EBE3D3] rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-[#88734C]">
              <Laptop className="w-5 h-5 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider">
                {language === "vi" ? "Hạn chế thiết bị" : "Device Notice"}
              </span>
            </div>
            <p className="text-[12px] text-warm-650 leading-relaxed font-semibold">
              {language === "vi"
                ? "Giao diện quản lý Admin hoạt động tốt nhất trên máy tính. Để thực hiện chỉnh sửa dữ liệu đầy đủ, vui lòng sử dụng màn hình lớn."
                : "The Admin dashboard works best on a computer. Please use a desktop screen to perform full data edits."}
            </p>
          </div>

          {/* Pending Orders Notifications */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-warm-500 flex items-center gap-2">
                <Bell className="w-4 h-4 text-jotun-teal animate-bounce" />
                <span>{language === "vi" ? "Đơn hàng chờ xác nhận" : "Pending Approvals"}</span>
              </h2>
              {pendingOrders.length > 0 && (
                <span className="bg-jotun-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </div>

            {pendingOrders.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pendingOrders.map((ord) => (
                  <motion.div
                    key={ord.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-warm-250/70 rounded-2xl p-4 flex flex-col gap-3 shadow-xs relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-warm-400 block">ID: {ord.id}</span>
                        <h4 className="font-bold text-warm-900 text-xs mt-0.5">{ord.customer || "Khách vãng lai"}</h4>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-warm-900 bg-warm-50 px-2 py-0.5 rounded-lg border border-warm-200">
                        {formatPrice(ord.total)}
                      </span>
                    </div>

                    <div className="border-t border-b border-warm-100/70 py-2.5 text-xs text-warm-650 flex flex-col gap-1 font-medium">
                      <div className="flex justify-between">
                        <span className="text-warm-400">{language === "vi" ? "Sản phẩm:" : "Products:"}</span>
                        <span className="font-bold text-warm-800 text-right truncate max-w-[200px]" title={ord.items}>{ord.items}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-warm-400">Email:</span>
                        <span className="font-mono text-[10px] text-warm-700">{ord.userEmail || "Khách vãng lai"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-warm-400">{language === "vi" ? "Ngày đặt:" : "Ordered date:"}</span>
                        <span className="font-mono text-[10px] text-warm-700">{ord.date}</span>
                      </div>
                    </div>

                    {/* Status selection and confirm quick action */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 bg-warm-50/50 px-3 py-1.5 rounded-xl border border-warm-100">
                        <span className="text-[11px] text-warm-500 font-bold">{language === "vi" ? "Đổi trạng thái:" : "Change Status:"}</span>
                        <CustomSelect
                          value={ord.status}
                          onValueChange={(val) => handleUpdateStatus(ord.id, val)}
                          className="!h-8 !py-1 !px-2.5 !text-[11px] !w-32 bg-white"
                          options={[
                            { value: "PENDING", label: language === "vi" ? "Chờ duyệt" : "Pending" },
                            { value: "PROCESSING", label: language === "vi" ? "Đang giao" : "Delivering" },
                            { value: "COMPLETED", label: language === "vi" ? "Hoàn thành" : "Completed" },
                            { value: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" },
                          ]}
                        />
                      </div>
                      <button
                        onClick={() => handleConfirmOrder(ord.id)}
                        className="w-full py-2 bg-jotun-teal hover:bg-jotun-teal/90 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === "vi" ? "DUYỆT NHANH (HOÀN THÀNH)" : "QUICK APPROVE"}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-warm-200/60 rounded-2xl p-6 text-center text-xs font-bold text-warm-400 flex flex-col items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-warm-350" />
                <span>{language === "vi" ? "Không có đơn hàng chờ duyệt" : "No pending orders to approve"}</span>
              </div>
            )}
          </div>

          {/* Other Orders History */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-warm-500 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-warm-500" />
              <span>{language === "vi" ? "Lịch sử đơn hàng gần đây" : "Recent Orders History"}</span>
            </h2>

            <div className="flex flex-col gap-2.5">
              {otherOrders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border border-warm-200/60 rounded-xl p-3.5 flex flex-col gap-3 text-xs shadow-2xs"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] font-bold text-jotun-teal">{ord.id}</span>
                      <span className="font-bold text-warm-850">{ord.customer || "Khách vãng lai"}</span>
                      <span className="text-[10px] text-warm-450 font-mono mt-0.5">{ord.date}</span>
                    </div>
                    <div className="text-right font-mono font-bold text-warm-900">
                      {formatPrice(ord.total)}
                    </div>
                  </div>

                  <div className="border-t border-warm-100/70 pt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-warm-400 font-bold">{language === "vi" ? "Trạng thái:" : "Status:"}</span>
                    <CustomSelect
                      value={ord.status}
                      onValueChange={(val) => handleUpdateStatus(ord.id, val)}
                      className="!h-8 !py-1 !px-2.5 !text-[10px] !w-32 bg-white"
                      options={[
                        { value: "PENDING", label: language === "vi" ? "Chờ duyệt" : "Pending" },
                        { value: "PROCESSING", label: language === "vi" ? "Đang giao" : "Delivering" },
                        { value: "COMPLETED", label: language === "vi" ? "Hoàn thành" : "Completed" },
                        { value: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
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
