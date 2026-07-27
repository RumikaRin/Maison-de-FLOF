/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { passwordPolicyMessage } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule } from "@/components/ui/editorial";

interface PasswordTabProps {
  language: string;
  oldPassword: string;
  setOldPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  handlePasswordSubmit: (e: React.FormEvent) => void;
}

export function PasswordTab({
  language,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handlePasswordSubmit,
}: PasswordTabProps) {
  return (
    <section className="text-left">
      <h2 className="fl-display text-fl-xl">
        {language === "vi" ? "Đổi mật khẩu" : "Change Password"}
      </h2>
      <Rule weight="strong" className="mt-fl-xs" />
      <p className="fl-measure mt-fl-xs text-fl-sm text-atelier-ink-2">
        {passwordPolicyMessage(language === "vi" ? "vi" : "en")}
      </p>

      <form onSubmit={handlePasswordSubmit} className="mt-fl-md flex flex-col gap-fl-sm">
        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="password-old">
            {language === "vi" ? "Mật khẩu cũ" : "Old Password"}
          </Label>
          <Input
            id="password-old"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="password-new">
              {language === "vi" ? "Mật khẩu mới" : "New Password"}
            </Label>
            <Input
              id="password-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="password-confirm">
              {language === "vi" ? "Xác nhận mật khẩu mới" : "Confirm New Password"}
            </Label>
            <Input
              id="password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" className="mt-fl-2xs self-start">
          {language === "vi" ? "Cập nhật mật khẩu" : "Update Password"}
        </Button>
      </form>
    </section>
  );
}
