"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
            "pointer-events-auto mt-4 mx-auto flex items-center justify-between gap-2 sm:gap-6 md:gap-12",
            "rounded-full transition-all duration-700 border shadow-xl",
            isScrolled
              ? "bg-white/85 backdrop-blur-xl border-warm-300 shadow-black/[0.04] py-2 w-[92vw] sm:w-[90vw] max-w-[1400px] h-16 md:h-[68px] px-4 sm:px-6 md:px-8"
              : "bg-white/70 backdrop-blur-lg border-warm-300 shadow-black/[0.02] py-3 w-[95vw] sm:w-[94vw] max-w-[1550px] h-16 md:h-[76px] px-4 sm:px-8 md:px-10"
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          {/* Logo */}
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 shrink-0 group">
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
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Control Capsule (Language, Cart, Account/Login) */}
            <div className="flex items-center gap-1.5 p-1 bg-warm-50/50 hover:bg-warm-50/80 border border-warm-200/80 rounded-full transition-all duration-300 shadow-sm hover:border-warm-300">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:inline-block px-3 py-1.5 text-[11px] font-bold rounded-full hover:bg-white hover:text-warm-900 text-warm-600 transition-all duration-300 hover:shadow-sm"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                title="Switch language"
              >
                {language === "vi" ? "ENGLISH" : "TIẾNG VIỆT"}
              </button>

              {/* Divider 1 */}
              <div className="hidden sm:block w-[1px] h-3.5 bg-warm-200/80" />

              {/* Cart */}
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white hover:shadow-sm text-warm-900 transition-all duration-300 text-xs font-bold"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                <ShoppingCart className="h-4 w-4 text-warm-900" />
                <span className="hidden sm:inline">{language === "vi" ? "Giỏ hàng" : "Cart"}</span>
                <span className={cn(
                  "flex items-center justify-center text-[9px] font-medium",
                  "bg-warm-900 text-white rounded-full min-w-4 h-4 px-1 shrink-0",
                  "sm:bg-transparent sm:text-warm-900 sm:p-0 sm:w-auto sm:h-auto sm:text-xs sm:font-bold"
                )}>
                  {cartCount}
                </span>
              </Link>

              {/* Account - Hidden on Mobile, shown on Desktop */}
              {mounted && status === "authenticated" && user ? (
                <>
                  {/* Divider 2 */}
                  <div className="hidden md:block w-[1px] h-3.5 bg-warm-200/80" />

                  <div ref={avatarRef} className="hidden md:block relative">
                    <button 
                      onClick={() => setIsAvatarOpen(!isAvatarOpen)}
                      className="flex items-center p-0.5 rounded-full hover:scale-105 transition-transform duration-300 focus:outline-none"
                      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                      aria-expanded={isAvatarOpen}
                      aria-haspopup="menu"
                    >
                      <div className="h-6 w-6 bg-jotun-teal text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm">
                        {(user.name || user.email || "??").slice(0, 2).toUpperCase()}
                      </div>
                    </button>

                    <div 
                      className={cn(
                        "absolute top-full right-0 pt-3 w-52 z-50 transition-all duration-300",
                        isAvatarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                      )}
                      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                    >
                      <div 
                        className={cn(
                          "bg-white border border-black/[0.06] rounded-2xl shadow-xl overflow-hidden transition-transform duration-300",
                          isAvatarOpen ? "translate-y-0" : "translate-y-2"
                        )}
                        style={{ backdropFilter: "none" }}
                      >
                        <div className="p-3 border-b border-warm-100 bg-warm-50">
                          <p className="text-xs font-bold text-warm-900 truncate">{user.name || "User"}</p>
                          <p className="text-[10px] text-warm-700 font-mono truncate">{user.email}</p>
                        </div>
                        <div className="p-2 flex flex-col gap-0.5 text-left">
                          <Link 
                            href="/profile" 
                            onClick={() => {
                              setMobileOpen(false);
                              setIsAvatarOpen(false);
                            }} 
                            className="flex items-center gap-2 px-3 py-2 text-xs text-warm-700 hover:bg-warm-50 rounded-xl font-bold"
                          >
                            {language === "vi" ? "Tài khoản" : "My Account"}
                          </Link>
                          {userRole === "ADMIN" && (
                            <Link 
                              href="/admin" 
                              onClick={() => {
                                setMobileOpen(false);
                                setIsAvatarOpen(false);
                              }} 
                              className="flex items-center gap-2 px-3 py-2 text-xs text-warm-700 hover:bg-warm-50 rounded-xl font-bold"
                            >
                              Admin
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setMobileOpen(false);
                              setIsAvatarOpen(false);
                              signOut({ callbackUrl: "/" });
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl font-bold w-full text-left"
                          >
                            {language === "vi" ? "Đăng xuất" : "Logout"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Divider 2 for Login */}
                  <div className="hidden md:block w-[1px] h-3.5 bg-warm-200/80" />

                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="hidden md:inline-block bg-warm-900 hover:bg-warm-800 text-white text-[11px] px-3.5 py-1.5 rounded-full font-bold transition-all duration-300 shadow-sm"
                  >
                    <span>{language === "vi" ? "Đăng nhập" : "Login"}</span>
                  </Link>
                </>
              )}
            </div>

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
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex flex-col justify-end sm:justify-center items-center p-4">
            {/* Background Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-warm-900/20 backdrop-blur-md"
            />

            {/* Menu Box */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm bg-white border border-warm-200/80 shadow-2xl rounded-[28px] p-6 flex flex-col gap-6 overflow-hidden z-10 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-warm-100 pb-3">
                <span className="font-bromise font-extrabold text-base tracking-widest text-warm-900">
                  FLOF
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-7 w-7 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-800 transition-colors flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link, i) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 flex items-center justify-between group",
                          isActive
                            ? "bg-warm-900 text-white"
                            : "text-warm-800 hover:bg-warm-50 hover:text-warm-900"
                        )}
                      >
                        <span>{language === "vi" ? link.keyVi : link.keyEn}</span>
                        <span className={cn("text-xs transition-transform group-hover:translate-x-1", isActive ? "text-white/60" : "text-warm-400")}>
                          ➔
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Account Section */}
              <div className="border-t border-warm-100 pt-4 flex flex-col gap-3">
                {mounted && status === "authenticated" && user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-warm-50/70 p-3 rounded-2xl border border-warm-100">
                      <div className="h-8 w-8 bg-jotun-teal text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {(user.name || user.email || "??").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-bold text-warm-900 truncate">{user.name || "User"}</p>
                        <p className="text-[10px] text-warm-500 truncate font-mono">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-4 py-2.5 bg-warm-50 hover:bg-warm-100 text-warm-800 text-xs font-bold rounded-xl border border-warm-200 transition-colors"
                      >
                        {language === "vi" ? "Tài khoản" : "Account"}
                      </Link>
                      {userRole === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center px-4 py-2.5 bg-jotun-teal/10 hover:bg-jotun-teal/15 text-jotun-teal text-xs font-bold rounded-xl border border-jotun-teal/20 transition-colors"
                        >
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className={cn(
                          "flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-xl border border-red-100 transition-colors",
                          userRole !== "ADMIN" ? "col-span-1" : "col-span-2"
                        )}
                      >
                        {language === "vi" ? "Đăng xuất" : "Logout"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center py-3 bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold rounded-2xl shadow-sm transition-all text-center"
                  >
                    {language === "vi" ? "Đăng nhập tài khoản" : "Log In Account"}
                  </Link>
                )}
              </div>

              {/* Language Section */}
              <div className="flex items-center justify-between border-t border-warm-100 pt-4">
                <span className="text-[11px] font-bold text-warm-500 uppercase tracking-wider">
                  {language === "vi" ? "Ngôn ngữ" : "Language"}
                </span>
                <button
                  onClick={() => {
                    toggleLanguage();
                  }}
                  className="px-3 py-1.5 bg-warm-50 hover:bg-warm-100 border border-warm-200 rounded-full text-[10px] font-bold text-warm-800 transition-all"
                >
                  {language === "vi" ? "ENGLISH 🇬🇧" : "TIẾNG VIỆT 🇻🇳"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
