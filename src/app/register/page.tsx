"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { toast } from "sonner";


export default function RegisterPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleRegister = (e: React.FormEvent) => {
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

    setIsLoading(true);

    setTimeout(() => {
      // Load accounts from localStorage
      const existingAccounts = localStorage.getItem("sonvn-accounts");
      let accountsArray = [];
      if (existingAccounts) {
        try { accountsArray = JSON.parse(existingAccounts); } catch (err) {}
      }

      // Check if user already exists
      if (accountsArray.some((acc: any) => acc.email === email)) {
        toast.error(
          language === "vi" ? "Email này đã được đăng ký." : "Email is already registered."
        );
        setIsLoading(false);
        return;
      }

      // Add new account
      accountsArray.push({ name, email, password, role: "CUSTOMER" });
      localStorage.setItem("sonvn-accounts", JSON.stringify(accountsArray));

      setIsLoading(false);
      toast.success(
        language === "vi" ? "Đăng ký tài khoản thành công!" : "Account created successfully!"
      );
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="w-full bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[80vh] flex flex-col justify-center py-12">
      <div className="bg-white border border-warm-200/80 p-8 rounded-2xl shadow-md flex flex-col gap-6 w-full max-w-md mx-auto text-left">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold font-serif text-warm-900">{language === "vi" ? "Đăng Ký Tài Khoản" : "Create Account"}</h2>
          <p className="text-xs text-warm-500">
            {language === "vi" ? "Đăng ký thành viên để nhận bảng màu miễn phí và theo dõi đơn hàng." : "Join Maison de FLOF for free swatches catalog and order tracking."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Họ và tên" : "Full Name"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "vi" ? "Nguyễn Văn A" : "John Doe"}
              className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all text-warm-800"
            />
          </div>

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

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-warm-450">
              {language === "vi" ? "Xác nhận mật khẩu" : "Confirm Password"}
            </label>
            <input
              type="password"
              required
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

        {/* Redirect login */}
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
