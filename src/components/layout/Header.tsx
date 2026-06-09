"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/products", keyVi: "Sản phẩm", keyEn: "Products" },
  { href: "/colors", keyVi: "Bảng màu", keyEn: "Colors" },
  { href: "/color-visualizer", keyVi: "Phối màu", keyEn: "Visualizer" },
  { href: "/find-dealer", keyVi: "Đại lý", keyEn: "Dealers" },
  { href: "/blog", keyVi: "Tư vấn", keyEn: "Blog" },
];

export default function Header() {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguageStore();
  const t = useTrans(language);
  const getCartItemCount = useCartStore((state) => state.getCartItemCount);
  const { data: session, status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = mounted ? getCartItemCount() : 0;
  const user = session?.user;
  const userRole = (user as any)?.role;

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-700 pointer-events-none"
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "pointer-events-auto mt-4 mx-auto flex items-center justify-between gap-6 md:gap-12",
            "rounded-full transition-all duration-700 border shadow-xl",
            isScrolled
              ? "bg-white/85 backdrop-blur-xl border-warm-300 shadow-black/[0.04] py-2 w-[90vw] max-w-[1400px] h-16 md:h-[68px] px-6 md:px-8"
              : "bg-white/70 backdrop-blur-lg border-warm-300 shadow-black/[0.02] py-3 w-[94vw] max-w-[1550px] h-16 md:h-[76px] px-8 md:px-10"
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="font-bromise font-bold text-xl tracking-widest uppercase text-warm-900 leading-none group-hover:text-jotun-teal transition-colors duration-550">
              FLOF
            </span>
            <span className="hidden xl:block text-[9px] text-warm-500 font-medium border-l border-warm-200 pl-2.5 leading-tight">
              {language === "vi" ? (
                <>Sơn Cao Cấp<br />Chính Hãng</>
              ) : (
                <>Premium &<br />Authentic Paint</>
              )}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-0.5" role="navigation">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-500",
                    isActive
                      ? "bg-warm-900 text-white"
                      : "text-warm-700 hover:bg-warm-100 hover:text-warm-900"
                  )}
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                >
                  {language === "vi" ? link.keyVi : link.keyEn}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:inline-block px-2.5 py-1.5 text-[11px] font-bold rounded-full hover:bg-warm-100 text-warm-600 transition-all duration-500"
              style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              title="Switch language"
            >
              {language === "vi" ? "ENGLISH" : "TIẾNG VIỆT"}
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full hover:bg-warm-100 text-warm-900 transition-all duration-500 text-xs font-bold"
              style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
              <ShoppingCart className="h-4 w-4 text-warm-900" />
              <span>{language === "vi" ? "Giỏ hàng" : "Cart"}</span>
              <span>({cartCount})</span>
            </Link>

            {/* Account */}
            {mounted && status === "authenticated" && user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-warm-100 text-warm-700 transition-all duration-500"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}>
                  <div className="h-6 w-6 bg-jotun-teal text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {(user.name || user.email || "??").slice(0, 2).toUpperCase()}
                  </div>
                </button>

                <div className="absolute top-full right-0 pt-3 w-52 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-500"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}>
                  <div className="bg-white border border-black/[0.06] rounded-2xl shadow-xl overflow-hidden transition-transform duration-500 translate-y-2 group-hover:translate-y-0"
                    style={{ backdropFilter: "none" }}>
                    <div className="p-3 border-b border-warm-100 bg-warm-50">
                      <p className="text-xs font-bold text-warm-900 truncate">{user.name || "User"}</p>
                      <p className="text-[10px] text-warm-700 font-mono truncate">{user.email}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-0.5 text-left">
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-xs text-warm-700 hover:bg-warm-50 rounded-xl font-bold">
                        {language === "vi" ? "Tài khoản" : "My Account"}
                      </Link>
                      {userRole === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-xs text-warm-700 hover:bg-warm-50 rounded-xl font-bold">
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl font-bold w-full text-left"
                      >
                        {language === "vi" ? "Đăng xuất" : "Logout"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-warm-900 hover:bg-warm-800 text-white text-[12px] px-4 py-2.5 rounded-full font-bold transition-all duration-300 shadow-sm"
              >
                <span>{language === "vi" ? "Đăng nhập" : "Login"}</span>
              </Link>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-full hover:bg-warm-100 text-warm-800 transition-all duration-300 border border-warm-200"
            >
              {mobileOpen ? (language === "vi" ? "Đóng" : "Close") : "Menu"}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-white/90 backdrop-blur-3xl flex flex-col items-center justify-center gap-6 p-8"
          onClick={() => setMobileOpen(false)}
        >
          {NAV_LINKS.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-2xl font-serif font-bold transition-all duration-700",
                  isActive ? "text-jotun-teal" : "text-warm-800 hover:text-jotun-teal"
                )}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {language === "vi" ? link.keyVi : link.keyEn}
              </Link>
            );
          })}
          {mounted && status === "authenticated" && userRole === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="text-2xl font-serif font-bold text-jotun-teal hover:text-warm-900 transition-colors animate-fade-in"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </>
  );
}
