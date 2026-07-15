"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguageStore } from "@/store/language-store";
import { passwordPolicyMessage, isPasswordStrong } from "@/lib/password-policy";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageStore();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !token || !password || !confirmPassword) {
      toast.error(language === "vi" ? "Vui lòng điền đầy đủ thông tin." : "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === "vi" ? "Mật khẩu xác nhận không khớp." : "Passwords do not match.");
      return;
    }
    if (!isPasswordStrong(password)) {
      toast.error(passwordPolicyMessage(language === "vi" ? "vi" : "en"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          data.error ||
            (language === "vi" ? "Đặt lại mật khẩu thất bại." : "Password reset failed."),
        );
        setIsLoading(false);
        return;
      }
      toast.success(
        language === "vi"
          ? "Đặt lại mật khẩu thành công. Vui lòng đăng nhập."
          : "Password reset successful. Please sign in.",
      );
      router.push("/login");
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối máy chủ." : "Connection error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-warm-200/80 p-8 rounded-2xl shadow-md flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="text-center flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold font-serif text-warm-900">
          {language === "vi" ? "Đặt lại mật khẩu" : "Reset password"}
        </h2>
        <p className="text-xs text-warm-500">{passwordPolicyMessage(language === "vi" ? "vi" : "en")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-warm-450">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-warm-450">
            {language === "vi" ? "Mã token" : "Token"}
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-warm-450">
            {language === "vi" ? "Mật khẩu mới" : "New password"}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-warm-450">
            {language === "vi" ? "Xác nhận mật khẩu" : "Confirm password"}
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-jotun-teal text-white text-xs font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-60"
        >
          {isLoading
            ? language === "vi"
              ? "Đang lưu..."
              : "Saving..."
            : language === "vi"
              ? "Đặt lại mật khẩu"
              : "Reset password"}
        </button>
      </form>

      <p className="text-center text-xs text-warm-500">
        <Link href="/login" className="text-jotun-teal font-semibold hover:underline">
          {language === "vi" ? "Quay lại đăng nhập" : "Back to login"}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full bg-jotun-ivory text-warm-900 min-h-[80vh] flex flex-col justify-center py-12">
      <Suspense fallback={<div className="text-center text-sm text-warm-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
