"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { isPasswordStrong, passwordPolicyMessage } from "@/lib/password-policy";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-contract";


export default function RegisterPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ các thông tin." : "Please enter all required details."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        language === "vi" ? "Mật khẩu xác nhận không trùng khớp." : "Passwords do not match."
      );
      return;
    }

    if (!isPasswordStrong(password)) {
      toast.error(passwordPolicyMessage(language === "vi" ? "vi" : "en"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          getApiErrorMessage(
            data,
            language === "vi" ? "Đăng ký thất bại." : "Registration failed.",
          ),
        );
        setIsLoading(false);
        return;
      }

      toast.success(
        language === "vi"
          ? "Tài khoản đã được tạo. Hãy kiểm tra email để xác minh."
          : "Account created. Check your email to verify it."
      );
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(
        language === "vi" ? "Lỗi kết nối đến máy chủ." : "Connection error."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[80vh] flex flex-col justify-center py-12">
      <div className="bg-white border border-warm-200/80 p-8 rounded-2xl shadow-md flex flex-col gap-6 w-full max-w-md mx-auto text-left">
        <div className="text-center flex flex-col items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold font-serif text-warm-900">{language === "vi" ? "Đăng Ký Tài Khoản" : "Create Account"}</h2>
          <p className="text-xs text-warm-500">
            {language === "vi" ? "Đăng ký thành viên để nhận bảng màu miễn phí và theo dõi đơn hàng." : "Join Maison de FLOF for free swatches catalog and order tracking."}
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="register-name" className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Họ và tên" : "Full Name"}
            </label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "vi" ? "Nguyễn Văn A" : "John Doe"}
              className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="register-email" className="text-[10px] font-bold uppercase text-warm-450">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="register-password" className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Mật khẩu" : "Password"}
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
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

          <div className="flex flex-col gap-1">
            <label htmlFor="register-confirm-password" className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Xác nhận mật khẩu" : "Confirm Password"}
            </label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-warm-900 text-white font-bold py-3.5 rounded-xl hover:bg-warm-800 disabled:bg-warm-200 transition-colors shadow-xs flex items-center justify-center gap-2 text-xs mt-2"
          >
            {isLoading ? (language === "vi" ? "Đang xử lý..." : "Processing...") : (language === "vi" ? "Đăng ký tài khoản" : "Sign Up")}
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
        </button>

        <div className="text-center text-xs text-warm-550">
          <span>{language === "vi" ? "Đã có tài khoản?" : "Already have an account?"}</span>{" "}
          <Link href="/login" className="text-jotun-teal font-bold hover:underline font-serif">
            {t.navLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
