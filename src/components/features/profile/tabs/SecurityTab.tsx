"use client";

import { useState } from "react";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";

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
    <section
      aria-labelledby="security-heading"
      className="rounded-2xl border border-warm-200/80 bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-2 border-b border-warm-100 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="security-heading" className="font-serif text-2xl font-bold text-warm-900">
            {vi ? "Bảo mật quản trị viên" : "Administrator security"}
          </h1>
          <span
            role="status"
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              mfaEnabled
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {mfaEnabled
              ? vi ? "MFA đang bật" : "MFA enabled"
              : vi ? "MFA chưa bật" : "MFA disabled"}
          </span>
        </div>
        <p className="text-sm leading-6 text-warm-600">
          {vi
            ? "MFA bảo vệ tài khoản admin bằng ứng dụng xác thực và mã khôi phục dùng một lần."
            : "MFA protects the admin account with an authenticator app and single-use recovery codes."}
        </p>
      </div>

      {!mfaEnabled && !setup && recoveryCodes.length === 0 ? (
        <div className="pt-6">
          <button
            type="button"
            onClick={() => void beginSetup()}
            disabled={pendingAction !== null}
            className="rounded-xl bg-warm-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pendingAction === "setup"
              ? vi ? "Đang tạo…" : "Creating…"
              : vi ? "Thiết lập MFA" : "Set up MFA"}
          </button>
        </div>
      ) : null}

      {setup ? (
        <form onSubmit={verifySetup} className="flex flex-col gap-5 pt-6">
          <div className="rounded-xl border border-jotun-teal/20 bg-jotun-teal/5 p-4">
            <p className="mb-3 text-sm font-semibold text-warm-800">
              {vi
                ? "Thêm tài khoản vào ứng dụng xác thực bằng URI hoặc khóa bí mật dưới đây."
                : "Add the account to your authenticator using the URI or secret below."}
            </p>
            <label className="block text-xs font-bold uppercase text-warm-500">
              {vi ? "Khóa bí mật" : "Secret key"}
            </label>
            <output className="mt-1 block break-all rounded-lg bg-white p-3 font-mono text-sm text-warm-900">
              {setup.secret}
            </output>
            <label className="mt-4 block text-xs font-bold uppercase text-warm-500">
              Authenticator URI
            </label>
            <output className="mt-1 block break-all rounded-lg bg-white p-3 font-mono text-xs text-warm-700">
              {setup.otpauthUri}
            </output>
          </div>
          <div>
            <label htmlFor="mfa-verification-code" className="text-sm font-bold text-warm-800">
              {vi ? "Mã 6 chữ số" : "6-digit code"}
            </label>
            <input
              id="mfa-verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              className="mt-2 block w-full max-w-xs rounded-xl border border-warm-200 px-4 py-3 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={pendingAction !== null}
            className="w-fit rounded-xl bg-jotun-teal px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pendingAction === "verify"
              ? vi ? "Đang xác minh…" : "Verifying…"
              : vi ? "Xác minh và bật MFA" : "Verify and enable MFA"}
          </button>
        </form>
      ) : null}

      {recoveryCodes.length > 0 ? (
        <div className="flex flex-col gap-4 pt-6">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <strong>{vi ? "Lưu ngay các mã này." : "Save these codes now."}</strong>{" "}
            {vi
              ? "Mỗi mã chỉ dùng được một lần và sẽ không được hiển thị lại."
              : "Each code works once and will not be shown again."}
          </div>
          <ul aria-label={vi ? "Mã khôi phục" : "Recovery codes"} className="grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li key={code} className="rounded-lg bg-warm-50 px-4 py-2 font-mono text-sm">
                {code}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void copyRecoveryCodes()} className="rounded-xl border border-warm-300 px-4 py-2 text-sm font-bold">
              {vi ? "Sao chép" : "Copy"}
            </button>
            <button type="button" onClick={downloadRecoveryCodes} className="rounded-xl border border-warm-300 px-4 py-2 text-sm font-bold">
              {vi ? "Tải tệp .txt" : "Download .txt"}
            </button>
          </div>
        </div>
      ) : null}

      {mfaEnabled && recoveryCodes.length === 0 ? (
        <form onSubmit={disableMfa} className="flex flex-col gap-4 pt-6">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
            <h2 className="font-bold text-red-900">{vi ? "Tắt MFA" : "Disable MFA"}</h2>
            <p className="mt-1 text-sm text-red-800">
              {vi
                ? "Xác nhận bằng mật khẩu và mã từ ứng dụng xác thực hoặc một mã khôi phục."
                : "Confirm with your password and an authenticator or recovery code."}
            </p>
          </div>
          <div>
            <label htmlFor="mfa-disable-password" className="text-sm font-bold text-warm-800">
              {vi ? "Mật khẩu" : "Password"}
            </label>
            <input id="mfa-disable-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block w-full max-w-md rounded-xl border border-warm-200 px-4 py-3" />
          </div>
          <div>
            <label htmlFor="mfa-disable-code" className="text-sm font-bold text-warm-800">
              {vi ? "Mã xác thực hoặc khôi phục" : "Authentication or recovery code"}
            </label>
            <input id="mfa-disable-code" autoComplete="one-time-code" required value={disableCode} onChange={(event) => setDisableCode(event.target.value)} className="mt-2 block w-full max-w-md rounded-xl border border-warm-200 px-4 py-3 font-mono" />
          </div>
          <button type="submit" disabled={pendingAction !== null} className="w-fit rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {pendingAction === "disable"
              ? vi ? "Đang tắt…" : "Disabling…"
              : vi ? "Tắt MFA" : "Disable MFA"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
