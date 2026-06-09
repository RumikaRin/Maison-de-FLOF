"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { email: "admin@sonvn.com", password: "admin123", label: "Admin" },
  { email: "customer1@sonvn.com", password: "customer123", label: "Customer" },
];

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ email và mật khẩu." : "Please enter your email and password."
      );
      return;
    }

    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result?.ok) {
      toast.error(
        language === "vi" ? "Email hoặc mật khẩu không chính xác." : "Incorrect email or password."
      );
      setIsLoading(false);
      return;
    }

    // Wait briefly for session cookie to propagate, then fetch session
    await new Promise((r) => setTimeout(r, 300));
    const session = await getSession();

    if (!session?.user) {
      toast.error(
        language === "vi" ? "Phiên đăng nhập không hợp lệ, vui lòng thử lại." : "Invalid session, please try again."
      );
      setIsLoading(false);
      return;
    }

    const role = (session.user as any)?.role;

    toast.success(
      language === "vi"
        ? (role === "ADMIN" ? "Chào mừng Quản trị viên quay trở lại!" : "Đăng nhập thành công!")
        : (role === "ADMIN" ? "Welcome back Admin!" : "Login successful!")
    );

    router.push(role === "ADMIN" ? "/admin" : "/profile");
    router.refresh();
  };

  const handleQuickLogin = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    toast.info(
      language === "vi"
        ? `Đã nạp tài khoản: ${acc.label}`
        : `Loaded account: ${acc.label}`
    );
  };

  return (
    <div className="w-full bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[80vh] flex flex-col justify-center py-12">
      <div className="bg-white border border-warm-200/80 p-8 rounded-2xl shadow-md flex flex-col gap-6 w-full max-w-md mx-auto text-left">
        <div className="text-center flex flex-col items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold font-serif text-warm-900">{language === "vi" ? "Đăng Nhập FLOF" : "Login to FLOF"}</h2>
          <p className="text-xs text-warm-500">
            {language === "vi" ? "Chào mừng bạn quay trở lại với cửa hàng sơn nước trực tuyến." : "Welcome back to your premium paint supplier."}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-warm-450">Email</label>
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

        {/* Quick Login Demo Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-warm-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-warm-450 text-center">
            {language === "vi" ? "Đăng nhập nhanh (Demo)" : "Quick Login (Demo)"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleQuickLogin(acc)}
                className="px-3 py-2 rounded-xl border border-warm-200 bg-warm-50 text-[10px] font-bold text-warm-650 hover:bg-warm-100 transition-colors"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-warm-550">
          <span>{language === "vi" ? "Chưa có tài khoản?" : "Don't have an account?"}</span>{" "}
          <Link href="/register" className="text-jotun-teal font-bold hover:underline">
            {language === "vi" ? "Đăng ký ngay" : "Register here"}
          </Link>
        </div>
      </div>
    </div>
  );
}
