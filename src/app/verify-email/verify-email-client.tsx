"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error-contract";

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
    <main className="min-h-[70vh] bg-jotun-ivory px-4 py-16">
      <section
        aria-live="polite"
        className="mx-auto flex max-w-md flex-col gap-5 rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-md"
      >
        <h1 className="font-serif text-2xl font-bold text-warm-900">
          Xác minh email
        </h1>
        <p className="text-sm text-warm-600">{message}</p>

        {status === "verified" ? (
          <Link
            href="/login"
            className="rounded-xl bg-warm-900 px-5 py-3 text-sm font-bold text-white"
          >
            Đăng nhập
          </Link>
        ) : (
          <>
            <label className="text-left text-xs font-bold text-warm-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-warm-200 px-3 py-2.5"
                autoComplete="email"
              />
            </label>
            <button
              type="button"
              onClick={resend}
              disabled={resending || !email}
              className="rounded-xl bg-warm-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {resending ? "Đang gửi..." : "Gửi lại liên kết"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
