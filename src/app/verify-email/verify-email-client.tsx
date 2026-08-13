/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule, TypographicLink } from "@/components/ui/editorial";

type Status = "idle" | "verifying" | "verified" | "error";

export default function VerifyEmailClient({
  initialEmail,
  token,
}: {
  initialEmail: string;
  token: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState(
    token ? "Đang xác minh email..." : "Hãy kiểm tra hộp thư để mở liên kết xác minh.",
  );
  const [resending, setResending] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!token || !initialEmail || submitted.current) return;
    submitted.current = true;

    void fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: initialEmail, token }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(getApiErrorMessage(body, "Không thể xác minh email."));
        }
        setStatus("verified");
        setMessage("Email đã được xác minh. Bạn có thể đăng nhập.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Không thể xác minh email.",
        );
      });
  }, [initialEmail, token]);

  async function resend() {
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      setMessage(
        getApiErrorMessage(
          body,
          body.message ||
            "Nếu tài khoản cần xác minh, chúng tôi đã gửi một liên kết mới.",
        ),
      );
    } catch {
      setMessage("Không thể gửi lại lúc này. Vui lòng thử lại sau.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-[70vh] w-full bg-atelier-paper py-fl-2xl text-atelier-ink">
      {/* The form sits directly on paper — no card box, just a top rule. */}
      <section
        aria-live="polite"
        className="mx-auto w-full max-w-sm px-[clamp(1rem,4vw,1.5rem)] text-left"
      >
        <Rule weight="strong" />
        <h1 className="fl-display mt-fl-md text-fl-2xl">Xác minh email</h1>
        <p
          className={`mt-fl-2xs text-fl-sm ${
            status === "error" ? "text-atelier-danger" : "text-atelier-ink-2"
          }`}
        >
          {message}
        </p>

        {status === "verified" ? (
          <div className="mt-fl-md">
            <TypographicLink href="/login" arrow="→">
              Đăng nhập
            </TypographicLink>
          </div>
        ) : (
          <div className="mt-fl-md flex flex-col gap-fl-sm">
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="verify-email-input">Email</Label>
              <Input
                id="verify-email-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <Button
              type="button"
              onClick={resend}
              disabled={resending || !email}
              data-state={resending ? "loading" : undefined}
              className="w-full"
            >
              {resending ? "Đang gửi..." : "Gửi lại liên kết"}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
