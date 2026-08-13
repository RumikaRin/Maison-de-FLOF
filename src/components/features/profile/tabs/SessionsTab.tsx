/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { AsyncState } from "@/components/ui/AsyncState";
import { Button } from "@/components/ui/button";
import { Rule } from "@/components/ui/editorial";

type AuthSessionItem = {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
};

export function SessionsTab({ language }: { language: string }) {
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    try {
      const response = await fetch("/api/profile/sessions", { signal });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(body, "Không thể tải phiên đăng nhập"),
        );
      }
      setSessions(body);
      setStatus("ready");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSessions(controller.signal);
    return () => controller.abort();
  }, [loadSessions]);

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
    <section className="text-left">
      <div className="flex flex-wrap items-end justify-between gap-fl-sm">
        <h2 className="fl-display text-fl-xl">
          {language === "vi" ? "Phiên đăng nhập" : "Signed-in sessions"}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => revoke({ allOthers: true })}
          disabled={
            revoking !== null ||
            sessions.filter((session) => !session.current).length === 0
          }
          data-state={revoking === "all-others" ? "loading" : undefined}
        >
          {language === "vi" ? "Thu hồi tất cả phiên khác" : "Revoke all others"}
        </Button>
      </div>
      <Rule weight="strong" className="mt-fl-xs" />
      <p className="mt-fl-xs text-fl-sm text-atelier-ink-2">
        {language === "vi"
          ? "Thu hồi quyền truy cập trên thiết bị bạn không còn sử dụng."
          : "Revoke access from devices you no longer use."}
      </p>

      {status === "loading" ? (
        <AsyncState
          status="loading"
          title={language === "vi" ? "Đang tải phiên…" : "Loading sessions…"}
          className="mt-6 min-h-40 border-0 bg-atelier-paper-2 shadow-none"
        />
      ) : status === "error" ? (
        <AsyncState
          status="error"
          title={
            language === "vi"
              ? "Không thể tải phiên đăng nhập"
              : "Unable to load sessions"
          }
          retryLabel={language === "vi" ? "Thử lại" : "Retry"}
          onRetry={() => void loadSessions()}
          className="mt-6 min-h-40 border-0 bg-atelier-paper-2 shadow-none"
        />
      ) : sessions.length === 0 ? (
        <AsyncState
          status="empty"
          title={language === "vi" ? "Không có phiên hoạt động" : "No active sessions"}
          className="mt-6 min-h-40 border-0 bg-atelier-paper-2 shadow-none"
        />
      ) : (
        <ul className="mt-fl-sm">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-fl-sm border-b border-atelier-rule py-fl-xs"
            >
              <div className="text-fl-sm text-atelier-ink-2">
                <p className="font-medium text-atelier-ink">
                  {session.current
                    ? language === "vi"
                      ? "Phiên hiện tại"
                      : "Current session"
                    : language === "vi"
                      ? "Phiên khác"
                      : "Other session"}
                </p>
                <p className="tabular-nums">
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
                  className="min-h-11 whitespace-nowrap text-fl-xs font-medium text-atelier-danger underline decoration-1 underline-offset-4 transition-opacity duration-fl-fast ease-fl-out hover:opacity-80 disabled:opacity-45 md:min-h-6"
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
