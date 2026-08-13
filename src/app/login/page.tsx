/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { toast } from "@/components/ui/csp-toast";
import { useGoogleProviderAvailable } from "@/hooks/use-google-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule, TypographicLink } from "@/components/ui/editorial";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const googleAvailable = useGoogleProviderAvailable();

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
      // Reveal the code field on failure: an MFA-enrolled administrator has no
      // other route to it. The label states it is only needed when 2FA is on,
      // so this does not imply the code was the reason for *this* failure.
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
    <div className="min-h-[80vh] w-full bg-atelier-paper py-fl-2xl text-atelier-ink">
      {/* The form sits directly on paper — no card box, just a top rule. */}
      <div className="mx-auto w-full max-w-sm px-[clamp(1rem,4vw,1.5rem)] text-left">
        <Rule weight="strong" />
        <h1 className="fl-display mt-fl-md text-fl-2xl">
          {language === "vi" ? "Đăng nhập" : "Sign in"}
        </h1>
        <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {language === "vi" ? "Chào mừng bạn quay trở lại với cửa hàng sơn nước trực tuyến." : "Welcome back to your premium paint supplier."}
        </p>

        <form onSubmit={handleLogin} className="mt-fl-md flex flex-col gap-fl-sm">
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
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
              <Label htmlFor="login-password">
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
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <div className="flex justify-end">
            <TypographicLink href="/forgot-password" arrow="→">
              {language === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
            </TypographicLink>
          </div>

          {!showMfaChallenge && (
            <button
              type="button"
              onClick={() => setShowMfaChallenge(true)}
              className="min-h-11 self-start whitespace-nowrap text-fl-xs text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-6"
            >
              {language === "vi"
                ? "Tài khoản có xác thực hai lớp?"
                : "Account uses two-factor authentication?"}
            </button>
          )}

          {showMfaChallenge && (
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="login-mfa-code">
                {language === "vi"
                  ? "Mã xác thực hai lớp (chỉ khi tài khoản đã bật)"
                  : "Two-factor code (only if your account has it enabled)"}
              </Label>
              <Input
                id="login-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                className="font-mono"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            data-state={isLoading ? "loading" : undefined}
            className="mt-fl-2xs w-full"
          >
            {isLoading ? (language === "vi" ? "Đang xử lý..." : "Processing...") : t.navLogin}
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
          <span>{language === "vi" ? "Chưa có tài khoản?" : "Don't have an account?"}</span>
          <TypographicLink href="/register" arrow="→">
            {language === "vi" ? "Đăng ký ngay" : "Register here"}
          </TypographicLink>
        </div>
      </div>
    </div>
  );
}
