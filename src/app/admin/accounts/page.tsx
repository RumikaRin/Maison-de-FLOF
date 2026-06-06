"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { Trash2, UserPlus, Shield, User, Key } from "lucide-react";

export default function AdminAccountsPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form states for creating a new user
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "CUSTOMER">("CUSTOMER");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sonvn-accounts");
    if (stored) {
      try {
        setAccounts(JSON.parse(stored));
      } catch (e) {
        setAccounts([]);
      }
    } else {
      const initialMock = [
        { name: "FLOF Admin", email: "admin@flof.vn", password: "123456", role: "ADMIN" },
        { name: "Nguyễn Văn Khách", email: "customer1@flof.vn", password: "123456", role: "CUSTOMER" }
      ];
      localStorage.setItem("sonvn-accounts", JSON.stringify(initialMock));
      setAccounts(initialMock);
    }
  }, []);

  if (!mounted) return null;

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error(language === "vi" ? "Vui lòng điền đầy đủ thông tin." : "Please fill in all fields.");
      return;
    }

    if (accounts.some(acc => acc.email === newUserEmail)) {
      toast.error(language === "vi" ? "Email đã tồn tại trong hệ thống." : "Email already exists.");
      return;
    }

    const newAcc = {
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem("sonvn-accounts", JSON.stringify(updated));

    // Reset Form
    setIsAddingUser(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("CUSTOMER");

    toast.success(
      language === "vi" ? "Đã thêm tài khoản mới thành công!" : "New account created successfully!"
    );
  };

  const handleToggleRole = (email: string) => {
    const updated = accounts.map((acc) => {
      if (acc.email === email) {
        const nextRole = acc.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
        return { ...acc, role: nextRole };
      }
      return acc;
    });
    setAccounts(updated);
    localStorage.setItem("sonvn-accounts", JSON.stringify(updated));
    toast.success(
      language === "vi" ? "Đã cập nhật phân quyền tài khoản!" : "Account role updated!"
    );
  };

  const handleDeleteAccount = (email: string) => {
    // Prevent self-deletion if logged in as admin
    const storedUser = localStorage.getItem("sonvn-user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email === email) {
          toast.error(
            language === "vi"
              ? "Bạn không thể xóa tài khoản Admin đang đăng nhập hiện tại!"
              : "You cannot delete the currently logged-in Admin account!"
          );
          return;
        }
      } catch (e) {}
    }

    const updated = accounts.filter((acc) => acc.email !== email);
    setAccounts(updated);
    localStorage.setItem("sonvn-accounts", JSON.stringify(updated));
    toast.success(
      language === "vi" ? "Đã xóa tài khoản thành công!" : "Account deleted successfully!"
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-warm-900">
            {language === "vi" ? "Quản Lý Tài Khoản" : "Accounts Management"}
          </h1>
          <p className="text-warm-550 text-xs mt-1">
            {language === "vi"
              ? "Danh sách người dùng hệ thống. Quản trị viên có thể đổi quyền hạn hoặc thêm/xóa tài khoản."
              : "List of system users. Admins can toggle permissions, create or delete accounts."}
          </p>
        </div>

        {!isAddingUser && (
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start md:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            {language === "vi" ? "Thêm tài khoản mới" : "Create Account"}
          </button>
        )}
      </div>

      {isAddingUser && (
        <form onSubmit={handleCreateAccount} className="bg-white border border-warm-200/80 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <h3 className="font-serif font-bold text-base border-b border-warm-100 pb-3 mb-2 text-warm-900">
            {language === "vi" ? "Thêm tài khoản người dùng" : "Create New User Account"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Họ và tên</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder={language === "vi" ? "Tên nhân viên / khách..." : "User full name..."}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Địa chỉ Email</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Mật khẩu khởi tạo</label>
              <input
                type="password"
                required
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder="••••••"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Phân quyền vai trò</label>
              <CustomSelect
                value={newUserRole}
                onValueChange={(val) => setNewUserRole(val as any)}
                options={[
                  { value: "CUSTOMER", label: language === "vi" ? "Khách Hàng (Customer)" : "Customer" },
                  { value: "ADMIN", label: language === "vi" ? "Quản Trị Viên (Admin)" : "Admin" },
                ]}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs"
            >
              {language === "vi" ? "Tạo tài khoản" : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold px-6 py-2.5 rounded-xl transition-all"
            >
              {language === "vi" ? "Hủy" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      {/* Accounts List Table */}
      <div className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pr-4">{language === "vi" ? "Họ và tên" : "Name"}</th>
                <th className="pb-3 px-4">Email</th>
                <th className="pb-3 px-4">{language === "vi" ? "Mật khẩu mẫu" : "Demo Password"}</th>
                <th className="pb-3 px-4">{language === "vi" ? "Vai trò" : "Role"}</th>
                <th className="pb-3 px-4 text-center">{language === "vi" ? "Thay đổi vai trò" : "Permissions"}</th>
                <th className="pb-3 pl-4 text-center">{language === "vi" ? "Hành động" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
              {accounts.map((acc) => (
                <tr key={acc.email} className="hover:bg-warm-50/50 transition-colors">
                  <td className="py-4 pr-4 text-warm-900 font-bold flex items-center gap-2">
                    {acc.role === "ADMIN" ? (
                      <span className="p-1.5 bg-warm-200 text-warm-850 rounded-lg">
                        <Shield className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-jotun-teal/10 text-jotun-teal rounded-lg">
                        <User className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {acc.name}
                  </td>
                  <td className="py-4 px-4 font-mono text-warm-600">{acc.email}</td>
                  <td className="py-4 px-4 font-mono text-warm-500 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-warm-400 shrink-0" />
                    <span>{acc.password}</span>
                  </td>
                  <td className="py-4 px-4">
                    {acc.role === "ADMIN" ? (
                      <span className="px-2.5 py-1 bg-warm-200 text-warm-800 text-[10px] font-bold rounded-lg">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-jotun-teal/10 text-jotun-teal text-[10px] font-bold rounded-lg">
                        CUSTOMER
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleRole(acc.email)}
                      className="text-xs font-bold text-jotun-teal hover:underline px-3 py-1.5 border border-jotun-teal/20 rounded-lg bg-jotun-teal/5"
                    >
                      {language === "vi" ? "Đổi sang " : "Set to "}
                      {acc.role === "ADMIN" ? "CUSTOMER" : "ADMIN"}
                    </button>
                  </td>
                  <td className="py-4 pl-4 text-center">
                    <button
                      onClick={() => handleDeleteAccount(acc.email)}
                      className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-red-600"
                      title={language === "vi" ? "Xóa tài khoản" : "Delete Account"}
                    >
                      {language === "vi" ? "Xóa" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
