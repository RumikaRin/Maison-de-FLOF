"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-contract";

export default function ForgotPasswordPage() {
  const { language } = useLanguageStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(language === "vi" ? "Vui lòng nhập email." : "Please enter your email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          getApiErrorMessage(
            data,
            language === "vi" ? "Gửi yêu cầu thất bại." : "Request failed.",
          ),
        );
        setIsLoading(false);
        return;
      }
      setSubmitted(true);
      toast.success(
        language === "vi"
          ? "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."
          : "If the email exists, we sent reset instructions.",
      );
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối máy chủ." : "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-jotun-ivory text-warm-900 min-h-[80vh] flex flex-col justify-center py-12">
      <div className="bg-white border border-warm-200/80 p-8 rounded-2xl shadow-md flex flex-col gap-6 w-full max-w-md mx-auto">
        <div className="text-center flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold font-serif text-warm-900">
            {language === "vi" ? "Quên mật khẩu" : "Forgot password"}
          </h2>
          <p className="text-xs text-warm-500">
            {language === "vi"
              ? "Nhập email đăng ký để nhận liên kết đặt lại mật khẩu (hiệu lực 1 giờ)."
              : "Enter your account email to receive a reset link (valid for 1 hour)."}
          </p>
        </div>

        {submitted ? (
          <div className="text-sm text-warm-700 bg-jotun-teal/5 border border-jotun-teal/20 rounded-xl p-4">
            {language === "vi"
              ? "Vui lòng kiểm tra hộp thư (và thư mục spam). Bạn có thể đóng trang này."
              : "Please check your inbox (and spam). You can close this page."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-warm-450">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-jotun-teal text-white text-xs font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-60"
            >
              {isLoading
                ? language === "vi"
                  ? "Đang gửi..."
                  : "Sending..."
                : language === "vi"
                  ? "Gửi liên kết"
                  : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-warm-500">
          <Link href="/login" className="text-jotun-teal font-semibold hover:underline">
            {language === "vi" ? "Quay lại đăng nhập" : "Back to login"}
          </Link>
        </p>
      </div>
    </div>
  );
}
