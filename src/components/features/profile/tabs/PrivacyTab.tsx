"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";

export function PrivacyTab({ language }: { language: string }) {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (confirmation !== "DELETE") return;
    setDeleting(true);
    try {
      const response = await fetch("/api/profile/delete-account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation, password: password || undefined }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            body,
            language === "vi"
              ? "Không thể xóa tài khoản."
              : "Account deletion failed.",
          ),
        );
      }
      toast.success(
        language === "vi"
          ? "Tài khoản đã được ẩn danh."
          : "Your account has been anonymized.",
      );
      await signOut({ redirect: false });
      window.location.assign("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Không thể xóa tài khoản."
            : "Account deletion failed.",
      );
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-warm-950">
          {language === "vi" ? "Dữ liệu & quyền riêng tư" : "Data & privacy"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-warm-700">
          {language === "vi"
            ? "Tải bản sao dữ liệu thuộc tài khoản này hoặc yêu cầu ẩn danh tài khoản."
            : "Download a copy of this account's data or permanently anonymize the account."}
        </p>
      </div>

      <div className="rounded-2xl border border-warm-200 bg-warm-50 p-5">
        <h3 className="font-bold text-warm-900">
          {language === "vi" ? "Xuất dữ liệu" : "Export data"}
        </h3>
        <p className="mt-1 text-xs leading-5 text-warm-700">
          {language === "vi"
            ? "Tệp JSON chỉ chứa dữ liệu của bạn và không chứa mật khẩu hoặc token."
            : "The JSON archive contains only your data and excludes passwords and tokens."}
        </p>
        <a
          href="/api/profile/data-export"
          download
          className="mt-4 inline-flex rounded-xl bg-warm-900 px-4 py-3 text-xs font-bold text-white hover:bg-warm-800"
        >
          {language === "vi" ? "Tải dữ liệu của tôi" : "Download my data"}
        </a>
      </div>

      <form
        onSubmit={deleteAccount}
        className="rounded-2xl border border-red-200 bg-red-50 p-5"
      >
        <h3 className="font-bold text-red-950">
          {language === "vi" ? "Xóa tài khoản" : "Delete account"}
        </h3>
        <p className="mt-1 text-xs leading-5 text-red-900">
          {language === "vi"
            ? "Hành động này thu hồi mọi phiên, xóa dữ liệu cá nhân và không thể hoàn tác. Dữ liệu đơn hàng bắt buộc sẽ được giữ ở dạng ẩn danh."
            : "This revokes every session and removes personal data. Required order records remain anonymized, and the action cannot be undone."}
        </p>
        <div className="mt-4 grid gap-3">
          <label className="text-xs font-semibold text-red-950">
            {language === "vi"
              ? "Nhập DELETE để xác nhận"
              : "Type DELETE to confirm"}
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-1 block h-10 w-full rounded-xl border border-red-200 bg-white px-3 text-sm"
              autoComplete="off"
            />
          </label>
          <label className="text-xs font-semibold text-red-950">
            {language === "vi"
              ? "Mật khẩu hiện tại (nếu có)"
              : "Current password (if applicable)"}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block h-10 w-full rounded-xl border border-red-200 bg-white px-3 text-sm"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            disabled={confirmation !== "DELETE" || deleting}
            className="rounded-xl bg-red-700 px-4 py-3 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-40"
          >
            {deleting
              ? language === "vi"
                ? "Đang xử lý…"
                : "Processing…"
              : language === "vi"
                ? "Ẩn danh và xóa tài khoản"
                : "Anonymize and delete account"}
          </button>
        </div>
      </form>
    </section>
  );
}
