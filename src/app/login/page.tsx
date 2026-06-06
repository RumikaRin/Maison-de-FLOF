"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { toast } from "sonner";


export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ email và mật khẩu." : "Please enter your email and password."
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Load accounts from localStorage
      let accountsArray = [];
      const storedAccounts = localStorage.getItem("sonvn-accounts");
      if (storedAccounts) {
        try { accountsArray = JSON.parse(storedAccounts); } catch (err) {}
      }

      // Initialize with default demo accounts if completely empty
      if (accountsArray.length === 0) {
        accountsArray = [
          { name: "FLOF Admin", email: "admin@flof.vn", password: "123456", role: "ADMIN" },
          { name: "Nguyễn Văn Khách", email: "customer1@flof.vn", password: "123456", role: "CUSTOMER" }
        ];
        localStorage.setItem("sonvn-accounts", JSON.stringify(accountsArray));
      }

      // Find the account matching credentials
      const foundUser = accountsArray.find((acc: any) => acc.email === email && acc.password === password);

      if (foundUser) {
        toast.success(
          language === "vi" 
            ? (foundUser.role === "ADMIN" ? "Chào mừng Quản trị viên quay trở lại!" : "Đăng nhập thành công!")
            : (foundUser.role === "ADMIN" ? "Welcome back Admin!" : "Login successful!")
        );
        localStorage.setItem("sonvn-user", JSON.stringify({
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role
        }));
        
        if (foundUser.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/profile");
        }
      } else {
        // Fallback checks for hardcoded fallback demo access just in case
        if (email === "admin@flof.vn" && password === "123456") {
          toast.success(language === "vi" ? "Chào mừng Quản trị viên quay trở lại!" : "Welcome back Admin!");
          localStorage.setItem("sonvn-user", JSON.stringify({ email, name: "FLOF Admin", role: "ADMIN" }));
          router.push("/admin");
        } else if (email === "customer1@flof.vn" && password === "123456") {
          toast.success(language === "vi" ? "Đăng nhập thành công!" : "Login successful!");
          localStorage.setItem("sonvn-user", JSON.stringify({ email, name: "Nguyễn Văn Khách", role: "CUSTOMER" }));
          router.push("/profile");
        } else {
          toast.error(
            language === "vi" ? "Email hoặc mật khẩu không chính xác." : "Incorrect email or password."
          );
        }
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("123456");
    toast.info(
      language === "vi" ? `Đã nạp email: ${roleEmail}` : `Loaded email: ${roleEmail}`
    );
  };

  return (
    <div className="w-full bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[80vh] flex flex-col justify-center py-12">
      <div className="bg-white border border-warm-200/80 p-8 rounded-2xl shadow-md flex flex-col gap-6 w-full max-w-md mx-auto text-left">
        {/* Logo brand */}
        <div className="text-center flex flex-col items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold font-serif text-warm-900">{language === "vi" ? "Đăng Nhập FLOF" : "Login to FLOF"}</h2>
          <p className="text-xs text-warm-500">
            {language === "vi" ? "Chào mừng bạn quay trở lại với cửa hàng sơn nước trực tuyến." : "Welcome back to your premium paint supplier."}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-warm-450">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Mật khẩu" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-jotun-teal hover:text-warm-850"
              >
                {showPassword ? (language === "vi" ? "[Ẩn]" : "[Hide]") : (language === "vi" ? "[Hiện]" : "[Show]")}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-warm-900 text-white font-bold py-3.5 rounded-xl hover:bg-warm-800 disabled:bg-warm-200 transition-colors shadow-xs flex items-center justify-center gap-2 text-xs mt-2"
          >
            {isLoading ? (language === "vi" ? "Đang xử lý..." : "Processing...") : t.navLogin}
          </button>
        </form>

        {/* Redirect sign up */}
        <div className="text-center text-xs text-warm-550">
          <span>{language === "vi" ? "Chưa có tài khoản?" : "Don't have an account?"}</span>{" "}
          <Link href="/register" className="text-jotun-teal font-bold hover:underline">
            {language === "vi" ? "Đăng ký ngay" : "Register here"}
          </Link>
        </div>

        {/* Quick log in helpers */}
        <div className="border-t border-warm-100 pt-5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-jotun-teal uppercase tracking-wider">
            <span>{language === "vi" ? "Đăng nhập nhanh dùng thử (Demo)" : "Quick Demo Access"}</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickLogin("admin@flof.vn")}
              className="text-[10px] font-bold text-left p-2.5 border border-warm-200 rounded-xl hover:bg-warm-50/50 flex justify-between items-center group bg-white text-warm-700 transition-all duration-200"
            >
              <span>🔑 Admin: <code className="text-jotun-teal bg-jotun-teal/5 px-1 py-0.5 rounded">admin@flof.vn</code></span>
              <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-jotun-teal text-xs font-bold font-mono">→</span>
            </button>
            <button
              onClick={() => handleQuickLogin("customer1@flof.vn")}
              className="text-[10px] font-bold text-left p-2.5 border border-warm-200 rounded-xl hover:bg-warm-50/50 flex justify-between items-center group bg-white text-warm-700 transition-all duration-200"
            >
              <span>👤 Customer: <code className="text-jotun-teal bg-jotun-teal/5 px-1 py-0.5 rounded">customer1@flof.vn</code></span>
              <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-jotun-teal text-xs font-bold font-mono">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
