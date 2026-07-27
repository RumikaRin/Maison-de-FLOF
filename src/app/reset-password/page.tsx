/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguageStore } from "@/store/language-store";
import { passwordPolicyMessage, isPasswordStrong } from "@/lib/password-policy";
import { toast } from "@/components/ui/csp-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule, TypographicLink } from "@/components/ui/editorial";

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
    <div className="mx-auto w-full max-w-sm px-[clamp(1rem,4vw,1.5rem)] text-left">
      <Rule weight="strong" />
      <h1 className="fl-display mt-fl-md text-fl-2xl">
        {language === "vi" ? "Đặt lại mật khẩu" : "Reset password"}
      </h1>
      <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
        {passwordPolicyMessage(language === "vi" ? "vi" : "en")}
      </p>

      <form onSubmit={handleSubmit} className="mt-fl-md flex flex-col gap-fl-sm">
        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="reset-token">
            {language === "vi" ? "Mã token" : "Token"}
          </Label>
          <Input
            id="reset-token"
            type="text"
            autoComplete="off"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="reset-password">
            {language === "vi" ? "Mật khẩu mới" : "New password"}
          </Label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="reset-confirm-password">
            {language === "vi" ? "Xác nhận mật khẩu" : "Confirm password"}
          </Label>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              ? "Đang lưu..."
              : "Saving..."
            : language === "vi"
              ? "Đặt lại mật khẩu"
              : "Reset password"}
        </Button>
      </form>

      <div className="mt-fl-md">
        <TypographicLink href="/login" arrow="→">
          {language === "vi" ? "Quay lại đăng nhập" : "Back to login"}
        </TypographicLink>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] w-full bg-atelier-paper py-fl-2xl text-atelier-ink">
      <Suspense fallback={<div className="text-center text-fl-sm text-atelier-ink-2">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
