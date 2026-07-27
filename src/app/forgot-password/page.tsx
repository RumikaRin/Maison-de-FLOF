/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule, TypographicLink } from "@/components/ui/editorial";

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
    <div className="min-h-[80vh] w-full bg-atelier-paper py-fl-2xl text-atelier-ink">
      {/* The form sits directly on paper — no card box, just a top rule. */}
      <div className="mx-auto w-full max-w-sm px-[clamp(1rem,4vw,1.5rem)] text-left">
        <Rule weight="strong" />
        <h1 className="fl-display mt-fl-md text-fl-2xl">
          {language === "vi" ? "Quên mật khẩu" : "Forgot password"}
        </h1>
        <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {language === "vi"
            ? "Nhập email đăng ký để nhận liên kết đặt lại mật khẩu (hiệu lực 1 giờ)."
            : "Enter your account email to receive a reset link (valid for 1 hour)."}
        </p>

        {submitted ? (
          <p className="mt-fl-md border-l-2 border-atelier-success pl-fl-xs text-fl-sm text-atelier-ink">
            {language === "vi"
              ? "Vui lòng kiểm tra hộp thư (và thư mục spam). Bạn có thể đóng trang này."
              : "Please check your inbox (and spam). You can close this page."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-fl-md flex flex-col gap-fl-sm">
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              data-state={isLoading ? "loading" : undefined}
              className="mt-fl-2xs w-full"
            >
              {isLoading
                ? language === "vi"
                  ? "Đang gửi..."
                  : "Sending..."
                : language === "vi"
                  ? "Gửi liên kết"
                  : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="mt-fl-md">
          <TypographicLink href="/login" arrow="→">
            {language === "vi" ? "Quay lại đăng nhập" : "Back to login"}
          </TypographicLink>
        </div>
      </div>
    </div>
  );
}
