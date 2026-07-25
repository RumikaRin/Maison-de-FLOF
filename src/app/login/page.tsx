"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { toast } from "@/components/ui/csp-toast";



export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
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
      mfaCode: mfaCode || undefined,
      redirect: false,
    });

    if (!result?.ok || result.error) {
      setShowMfaChallenge(true);
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

    router.push(role === "ADMIN" || role === "STAFF" ? "/admin" : "/profile");
    router.refresh();
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
            <label htmlFor="login-email" className="text-[10px] font-bold uppercase text-warm-450">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="login-password" className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Mật khẩu" : "Password"}
            </label>
            <div className="relative">
              <input
                id="login-password"
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
                className="absolute right-1 top-1/2 min-h-11 min-w-11 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-jotun-teal hover:text-warm-850"
              >
                {showPassword ? (language === "vi" ? "[Ẩn]" : "[Hide]") : (language === "vi" ? "[Hiện]" : "[Show]")}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <Link
              href="/forgot-password"
              className="text-[10px] font-bold text-jotun-teal hover:underline uppercase tracking-wide"
            >
              {language === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
            </Link>
          </div>

          {showMfaChallenge && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="login-mfa-code"
                className="text-[10px] font-bold uppercase text-warm-450"
              >
                {language === "vi"
                  ? "Mã xác thực (nếu đã bật)"
                  : "Authentication code (if enabled)"}
              </label>
              <input
                id="login-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                className="rounded-xl border border-warm-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-warm-800 focus:border-jotun-teal focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-warm-900 text-white font-bold py-3.5 rounded-xl hover:bg-warm-800 disabled:bg-warm-200 transition-colors shadow-xs flex items-center justify-center gap-2 text-xs mt-2"
          >
            {isLoading ? (language === "vi" ? "Đang xử lý..." : "Processing...") : t.navLogin}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-warm-200"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-2 text-warm-450">{language === "vi" ? "Hoặc tiếp tục với" : "Or continue with"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="w-full bg-white border border-warm-200 text-warm-800 font-bold py-3.5 rounded-xl hover:bg-warm-50 transition-colors shadow-xs flex items-center justify-center gap-2 text-xs"
        >
          <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
            <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.439 8.439 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd"/>
          </svg>
          Google
        </button>        <div className="text-center text-xs text-warm-550">
          <span>{language === "vi" ? "Chưa có tài khoản?" : "Don't have an account?"}</span>{" "}
          <Link href="/register" className="text-jotun-teal font-bold hover:underline">
            {language === "vi" ? "Đăng ký ngay" : "Register here"}
          </Link>
        </div>
      </div>
    </div>
  );
}
