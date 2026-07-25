"use client";

import { safeMotion } from "@/components/ui/motion-safe";
import { passwordPolicyMessage } from "@/lib/password-policy";

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
    <safeMotion.div
      key="password"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm text-left">
        <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
          {language === "vi" ? "Đổi mật khẩu" : "Change Password"}
        </h3>
        <p className="text-[11px] text-warm-500 -mt-3 mb-4">
          {passwordPolicyMessage(language === "vi" ? "vi" : "en")}
        </p>

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">
              {language === "vi" ? "Mật khẩu cũ" : "Old Password"}
            </label>
            <div className="relative">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">
                {language === "vi" ? "Mật khẩu mới" : "New Password"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">
                {language === "vi" ? "Xác nhận mật khẩu mới" : "Confirm New Password"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold px-6 py-3 mt-2 rounded-xl transition-all shadow-sm self-start"
          >
            {language === "vi" ? "Cập nhật mật khẩu" : "Update Password"}
          </button>
        </form>
      </div>
    </safeMotion.div>
  );
}

