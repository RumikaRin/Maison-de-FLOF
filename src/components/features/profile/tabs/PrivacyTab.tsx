/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule } from "@/components/ui/editorial";

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
    <section className="text-left">
      <h2 className="fl-display text-fl-xl">
        {language === "vi" ? "Dữ liệu & quyền riêng tư" : "Data & privacy"}
      </h2>
      <Rule weight="strong" className="mt-fl-xs" />
      <p className="fl-measure mt-fl-xs text-fl-sm leading-relaxed text-atelier-ink-2">
        {language === "vi"
          ? "Tải bản sao dữ liệu thuộc tài khoản này hoặc yêu cầu ẩn danh tài khoản."
          : "Download a copy of this account's data or permanently anonymize the account."}
      </p>

      {/* Export */}
      <div className="mt-fl-lg">
        <h3 className="text-fl-md font-medium text-atelier-ink">
          {language === "vi" ? "Xuất dữ liệu" : "Export data"}
        </h3>
        <p className="fl-measure mt-fl-3xs text-fl-sm text-atelier-ink-2">
          {language === "vi"
            ? "Tệp JSON chỉ chứa dữ liệu của bạn và không chứa mật khẩu hoặc token."
            : "The JSON archive contains only your data and excludes passwords and tokens."}
        </p>
        <Button asChild variant="outline" className="mt-fl-sm">
          <a href="/api/profile/data-export" download>
            {language === "vi" ? "Tải dữ liệu của tôi" : "Download my data"}
          </a>
        </Button>
      </div>

      <Rule className="mt-fl-lg" />

      {/* Delete — destructive, confirmed by typing */}
      <form onSubmit={deleteAccount} className="mt-fl-lg">
        <h3 className="text-fl-md font-medium text-atelier-danger">
          {language === "vi" ? "Xóa tài khoản" : "Delete account"}
        </h3>
        <p className="fl-measure mt-fl-3xs text-fl-sm leading-relaxed text-atelier-ink-2">
          {language === "vi"
            ? "Hành động này thu hồi mọi phiên, xóa dữ liệu cá nhân và không thể hoàn tác. Dữ liệu đơn hàng bắt buộc sẽ được giữ ở dạng ẩn danh."
            : "This revokes every session and removes personal data. Required order records remain anonymized, and the action cannot be undone."}
        </p>
        <div className="mt-fl-sm grid max-w-md gap-fl-sm">
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="privacy-delete-confirmation">
              {language === "vi"
                ? "Nhập DELETE để xác nhận"
                : "Type DELETE to confirm"}
            </Label>
            <Input
              id="privacy-delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="privacy-delete-password">
              {language === "vi"
                ? "Mật khẩu hiện tại (nếu có)"
                : "Current password (if applicable)"}
            </Label>
            <Input
              id="privacy-delete-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            variant="destructive"
            disabled={confirmation !== "DELETE" || deleting}
            data-state={deleting ? "loading" : undefined}
            className="justify-self-start"
          >
            {deleting
              ? language === "vi"
                ? "Đang xử lý…"
                : "Processing…"
              : language === "vi"
                ? "Ẩn danh và xóa tài khoản"
                : "Anonymize and delete account"}
          </Button>
        </div>
      </form>
    </section>
  );
}
