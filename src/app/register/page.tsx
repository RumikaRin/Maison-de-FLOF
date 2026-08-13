/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { isPasswordStrong, passwordPolicyMessage } from "@/lib/password-policy";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { useGoogleProviderAvailable } from "@/hooks/use-google-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule, TypographicLink } from "@/components/ui/editorial";

export default function RegisterPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const googleAvailable = useGoogleProviderAvailable();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !privacyConsent) {
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
        body: JSON.stringify({ name, email, password, privacyConsent }),
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

      // Verification is optional for customers — sign them straight in and let
      // them confirm the address later from profile settings. The verification
      // email is still sent, so the link in it keeps working.
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        toast.success(
          language === "vi"
            ? "Đã tạo tài khoản. Bạn có thể xác minh email sau trong phần Cài đặt."
            : "Account created. You can verify your email later in settings."
        );
        router.push("/profile");
        return;
      }

      toast.success(
        language === "vi"
          ? "Đã tạo tài khoản. Hãy đăng nhập để tiếp tục."
          : "Account created. Sign in to continue."
      );
      router.push("/login");
    } catch (err) {
      toast.error(
        language === "vi" ? "Lỗi kết nối đến máy chủ." : "Connection error."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] w-full bg-atelier-paper py-fl-2xl text-atelier-ink">
      {/* The form sits directly on paper — no card box, just a top rule. */}
      <div className="mx-auto w-full max-w-sm px-[clamp(1rem,4vw,1.5rem)] text-left">
        <Rule weight="strong" />
        <h1 className="fl-display mt-fl-md text-fl-2xl">
          {language === "vi" ? "Đăng ký tài khoản" : "Create account"}
        </h1>
        <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {language === "vi" ? "Đăng ký thành viên để nhận bảng màu miễn phí và theo dõi đơn hàng." : "Join Maison de FLOF for free swatches catalog and order tracking."}
        </p>

        <form onSubmit={handleRegister} className="mt-fl-md flex flex-col gap-fl-sm">
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="register-name">
              {language === "vi" ? "Họ và tên" : "Full Name"}
            </Label>
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "vi" ? "Nguyễn Văn A" : "John Doe"}
            />
          </div>

          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="flex flex-col gap-fl-2xs">
            <div className="flex items-baseline justify-between gap-fl-sm">
              <Label htmlFor="register-password">
                {language === "vi" ? "Mật khẩu" : "Password"}
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="whitespace-nowrap text-fl-xs text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink"
              >
                {showPassword ? (language === "vi" ? "Ẩn mật khẩu" : "Hide password") : (language === "vi" ? "Hiện mật khẩu" : "Show password")}
              </button>
            </div>
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="register-confirm-password">
              {language === "vi" ? "Xác nhận mật khẩu" : "Confirm Password"}
            </Label>
            <Input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <label className="flex items-start gap-fl-2xs text-fl-sm leading-relaxed text-atelier-ink-2">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(event) => setPrivacyConsent(event.target.checked)}
              required
              className="mt-1 h-4 w-4 shrink-0 accent-atelier-accent"
            />
            <span>
              {language === "vi"
                ? "Tôi đồng ý để FLOF xử lý dữ liệu tài khoản và đơn hàng theo chính sách quyền riêng tư."
                : "I consent to FLOF processing account and order data under the privacy policy."}
            </span>
          </label>

          <Button
            type="submit"
            disabled={isLoading}
            data-state={isLoading ? "loading" : undefined}
            className="mt-fl-2xs w-full"
          >
            {isLoading ? (language === "vi" ? "Đang xử lý..." : "Processing...") : (language === "vi" ? "Đăng ký tài khoản" : "Sign Up")}
          </Button>
        </form>

        {googleAvailable ? (
          <>
            <div className="mt-fl-md flex items-center gap-fl-sm">
              <Rule className="flex-1" />
              <span className="fl-label">{language === "vi" ? "Hoặc tiếp tục với" : "Or continue with"}</span>
              <Rule className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
              className="mt-fl-md w-full"
            >
              <svg className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
                <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.439 8.439 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd"/>
              </svg>
              Google
            </Button>
          </>
        ) : null}

        <div className="mt-fl-md flex flex-wrap items-baseline gap-x-fl-2xs text-fl-sm text-atelier-ink-2">
          <span>{language === "vi" ? "Đã có tài khoản?" : "Already have an account?"}</span>
          <TypographicLink href="/login" arrow="→">
            {t.navLogin}
          </TypographicLink>
        </div>
      </div>
    </div>
  );
}
