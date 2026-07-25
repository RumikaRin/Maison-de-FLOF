"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";

type AuthSessionItem = {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
};

export function SessionsTab({ language }: { language: string }) {
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/profile/sessions", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(getApiErrorMessage(body, "Không thể tải phiên đăng nhập"));
        }
        setSessions(body);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        toast.error(
          error instanceof Error ? error.message : "Không thể tải phiên đăng nhập",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function revoke(payload: { id?: string; allOthers?: boolean }) {
    const marker = payload.allOthers ? "all-others" : payload.id || "";
    setRevoking(marker);
    try {
      const response = await fetch("/api/profile/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, "Không thể thu hồi phiên"));
      }
      setSessions((current) =>
        payload.allOthers
          ? current.filter((session) => session.current)
          : current.filter((session) => session.id !== payload.id),
      );
      toast.success(
        language === "vi" ? "Đã thu hồi phiên đăng nhập." : "Session revoked.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thu hồi phiên",
      );
    } finally {
      setRevoking(null);
    }
  }

  return (
    <section className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-warm-900">
            {language === "vi" ? "Phiên đăng nhập" : "Signed-in sessions"}
          </h2>
          <p className="mt-1 text-xs text-warm-500">
            {language === "vi"
              ? "Thu hồi quyền truy cập trên thiết bị bạn không còn sử dụng."
              : "Revoke access from devices you no longer use."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => revoke({ allOthers: true })}
          disabled={
            revoking !== null ||
            sessions.filter((session) => !session.current).length === 0
          }
          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
        >
          {language === "vi" ? "Thu hồi tất cả phiên khác" : "Revoke all others"}
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-warm-500">Đang tải...</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warm-100 p-4"
            >
              <div className="text-xs text-warm-600">
                <p className="font-bold text-warm-900">
                  {session.current
                    ? language === "vi"
                      ? "Phiên hiện tại"
                      : "Current session"
                    : language === "vi"
                      ? "Phiên khác"
                      : "Other session"}
                </p>
                <p>
                  {language === "vi" ? "Hoạt động gần nhất" : "Last active"}:{" "}
                  {new Date(session.lastSeenAt).toLocaleString(
                    language === "vi" ? "vi-VN" : "en-US",
                  )}
                </p>
              </div>
              {!session.current && (
                <button
                  type="button"
                  onClick={() => revoke({ id: session.id })}
                  disabled={revoking !== null}
                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                >
                  {language === "vi" ? "Thu hồi" : "Revoke"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
