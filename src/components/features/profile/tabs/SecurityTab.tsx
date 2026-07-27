/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule } from "@/components/ui/editorial";

interface SecurityTabProps {
  language: string;
  mfaEnabled: boolean;
  onMfaStatusChange: (enabled: boolean) => void;
}

interface MfaSetup {
  secret: string;
  otpauthUri: string;
}

async function parseResponse(response: Response) {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Không thể cập nhật MFA"));
  }
  return data;
}

export function SecurityTab({
  language,
  mfaEnabled,
  onMfaStatusChange,
}: SecurityTabProps) {
  const vi = language === "vi";
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "setup" | "verify" | "disable" | null
  >(null);

  async function beginSetup() {
    setPendingAction("setup");
    try {
      const data = (await parseResponse(
        await fetch("/api/profile/mfa/setup", { method: "POST" }),
      )) as MfaSetup;
      setSetup(data);
      setRecoveryCodes([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MFA setup failed");
    } finally {
      setPendingAction(null);
    }
  }

  async function verifySetup(event: React.FormEvent) {
    event.preventDefault();
    setPendingAction("verify");
    try {
      const data = (await parseResponse(
        await fetch("/api/profile/mfa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: verificationCode.trim() }),
        }),
      )) as { success: boolean; recoveryCodes: string[] };
      setRecoveryCodes(data.recoveryCodes);
      setSetup(null);
      setVerificationCode("");
      onMfaStatusChange(true);
      toast.success(vi ? "Đã bật xác thực hai bước." : "Two-factor authentication enabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MFA verification failed");
    } finally {
      setPendingAction(null);
    }
  }

  async function disableMfa(event: React.FormEvent) {
    event.preventDefault();
    setPendingAction("disable");
    try {
      await parseResponse(
        await fetch("/api/profile/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            code: disableCode.trim(),
          }),
        }),
      );
      setPassword("");
      setDisableCode("");
      setRecoveryCodes([]);
      onMfaStatusChange(false);
      toast.success(vi ? "Đã tắt xác thực hai bước." : "Two-factor authentication disabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MFA disable failed");
    } finally {
      setPendingAction(null);
    }
  }

  async function copyRecoveryCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success(vi ? "Đã sao chép mã khôi phục." : "Recovery codes copied.");
    } catch {
      toast.error(vi ? "Không thể sao chép tự động." : "Could not copy automatically.");
    }
  }

  function downloadRecoveryCodes() {
    const blob = new Blob([`${recoveryCodes.join("\n")}\n`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flof-mfa-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="security-heading" className="text-left">
      <div className="flex flex-wrap items-end justify-between gap-fl-sm">
        <h1 id="security-heading" className="fl-display text-fl-2xl">
          {vi ? "Bảo mật quản trị viên" : "Administrator security"}
        </h1>
        <span
          role="status"
          className={`fl-label ${mfaEnabled ? "text-atelier-success" : "text-atelier-danger"}`}
        >
          {mfaEnabled
            ? vi ? "MFA đang bật" : "MFA enabled"
            : vi ? "MFA chưa bật" : "MFA disabled"}
        </span>
      </div>
      <Rule weight="strong" className="mt-fl-xs" />
      <p className="fl-measure mt-fl-xs text-fl-sm leading-relaxed text-atelier-ink-2">
        {vi
          ? "MFA bảo vệ tài khoản admin bằng ứng dụng xác thực và mã khôi phục dùng một lần."
          : "MFA protects the admin account with an authenticator app and single-use recovery codes."}
      </p>

      {!mfaEnabled && !setup && recoveryCodes.length === 0 ? (
        <div className="pt-fl-md">
          <Button
            type="button"
            onClick={() => void beginSetup()}
            disabled={pendingAction !== null}
            data-state={pendingAction === "setup" ? "loading" : undefined}
          >
            {pendingAction === "setup"
              ? vi ? "Đang tạo…" : "Creating…"
              : vi ? "Thiết lập MFA" : "Set up MFA"}
          </Button>
        </div>
      ) : null}

      {setup ? (
        <form onSubmit={verifySetup} className="flex flex-col gap-fl-md pt-fl-md">
          <div className="border-b border-t border-atelier-rule py-fl-sm">
            <p className="fl-measure text-fl-sm text-atelier-ink">
              {vi
                ? "Thêm tài khoản vào ứng dụng xác thực bằng URI hoặc khóa bí mật dưới đây."
                : "Add the account to your authenticator using the URI or secret below."}
            </p>
            <p className="fl-label mt-fl-sm">{vi ? "Khóa bí mật" : "Secret key"}</p>
            <output className="mt-fl-3xs block break-all rounded-surface bg-atelier-paper-2 p-fl-xs font-mono text-fl-sm text-atelier-ink">
              {setup.secret}
            </output>
            <p className="fl-label mt-fl-sm">Authenticator URI</p>
            <output className="mt-fl-3xs block break-all rounded-surface bg-atelier-paper-2 p-fl-xs font-mono text-fl-xs text-atelier-ink-2">
              {setup.otpauthUri}
            </output>
          </div>
          <div className="flex max-w-xs flex-col gap-fl-2xs">
            <Label htmlFor="mfa-verification-code">
              {vi ? "Mã 6 chữ số" : "6-digit code"}
            </Label>
            <Input
              id="mfa-verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              className="font-mono"
            />
          </div>
          <Button
            type="submit"
            disabled={pendingAction !== null}
            data-state={pendingAction === "verify" ? "loading" : undefined}
            className="self-start"
          >
            {pendingAction === "verify"
              ? vi ? "Đang xác minh…" : "Verifying…"
              : vi ? "Xác minh và bật MFA" : "Verify and enable MFA"}
          </Button>
        </form>
      ) : null}

      {recoveryCodes.length > 0 ? (
        <div className="flex flex-col gap-fl-sm pt-fl-md">
          <p className="fl-measure border-l-2 border-atelier-danger pl-fl-xs text-fl-sm text-atelier-ink">
            <strong>{vi ? "Lưu ngay các mã này." : "Save these codes now."}</strong>{" "}
            {vi
              ? "Mỗi mã chỉ dùng được một lần và sẽ không được hiển thị lại."
              : "Each code works once and will not be shown again."}
          </p>
          <ul aria-label={vi ? "Mã khôi phục" : "Recovery codes"} className="grid gap-fl-2xs sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li key={code} className="rounded-surface bg-atelier-paper-2 px-fl-sm py-fl-2xs font-mono text-fl-sm tabular-nums">
                {code}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-fl-sm">
            <Button type="button" variant="outline" onClick={() => void copyRecoveryCodes()}>
              {vi ? "Sao chép" : "Copy"}
            </Button>
            <Button type="button" variant="outline" onClick={downloadRecoveryCodes}>
              {vi ? "Tải tệp .txt" : "Download .txt"}
            </Button>
          </div>
        </div>
      ) : null}

      {mfaEnabled && recoveryCodes.length === 0 ? (
        <form onSubmit={disableMfa} className="flex flex-col gap-fl-sm pt-fl-md">
          <div className="border-b border-t border-atelier-rule py-fl-sm">
            <h2 className="text-fl-md font-medium text-atelier-danger">{vi ? "Tắt MFA" : "Disable MFA"}</h2>
            <p className="fl-measure mt-fl-3xs text-fl-sm text-atelier-ink-2">
              {vi
                ? "Xác nhận bằng mật khẩu và mã từ ứng dụng xác thực hoặc một mã khôi phục."
                : "Confirm with your password and an authenticator or recovery code."}
            </p>
          </div>
          <div className="flex max-w-md flex-col gap-fl-2xs">
            <Label htmlFor="mfa-disable-password">
              {vi ? "Mật khẩu" : "Password"}
            </Label>
            <Input
              id="mfa-disable-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex max-w-md flex-col gap-fl-2xs">
            <Label htmlFor="mfa-disable-code">
              {vi ? "Mã xác thực hoặc khôi phục" : "Authentication or recovery code"}
            </Label>
            <Input
              id="mfa-disable-code"
              autoComplete="one-time-code"
              required
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              className="font-mono"
            />
          </div>
          <Button
            type="submit"
            variant="destructive"
            disabled={pendingAction !== null}
            data-state={pendingAction === "disable" ? "loading" : undefined}
            className="self-start"
          >
            {pendingAction === "disable"
              ? vi ? "Đang tắt…" : "Disabling…"
              : vi ? "Tắt MFA" : "Disable MFA"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
