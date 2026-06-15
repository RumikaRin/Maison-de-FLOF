"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { UserPlus, Shield, User, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";

export default function AdminAccountsPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "STAFF" | "CUSTOMER">("CUSTOMER");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải tài khoản");
        setAccounts(data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error("Please fill in all fields."); return;
    }
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể tạo tài khoản");
      return;
    }
    setAccounts((current) => [data, ...current]);
    setIsAddingUser(false);
    setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("CUSTOMER");
    toast.success("New account created successfully!");
  };

  const handleUpdateRole = async (id: string, role: string) => {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể cập nhật role");
      return;
    }
    setAccounts((current) => current.map((account) => account.id === data.id ? data : account));
    toast.success("Account role updated!");
  };

  const triggerDeleteAccount = (id: string) => {
    setAccountToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    const response = await fetch(`/api/admin/users?id=${encodeURIComponent(accountToDelete)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa tài khoản");
      return;
    }
    setAccounts((current) => current.filter((account) => account.id !== accountToDelete));
    toast.success("Account deleted successfully!");
    setAccountToDelete(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-6 text-left"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-warm-900">
            {language === "vi" ? "Quản lí tài khoản" : "Accounts Management"}
          </h1>
          <p className="text-warm-550 text-xs mt-1">
            {language === "vi"
              ? "Danh sách người dùng của hệ thông .Quản trị viên có quyền thêm mới hoặc xóa tài khoản."
              : "List of system users. Admins can toggle permissions, create or delete accounts."}
          </p>
        </div>
        {!isAddingUser && (
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            {language === "vi" ? "Thêm tài khoản mới" : "Create Account"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAddingUser && (
          <motion.div
            key="add-user-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateAccount} className="bg-white border border-warm-200/80 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
              <h3 className="font-serif font-bold text-base border-b border-warm-100 pb-3 mb-2 text-warm-900">
                {language === "vi" ? "Them tai khoan nguoi dung" : "Create New User Account"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Ho va ten</label>
                  <input type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                    placeholder="User full name..." />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Email</label>
                  <input type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                    placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Password</label>
                  <input type="password" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                    placeholder="password" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-warm-450 uppercase tracking-wider">Role</label>
                  <CustomSelect value={newUserRole} onValueChange={(val) => setNewUserRole(val as any)}
                    options={[
                      { value: "CUSTOMER", label: "Customer" },
                      { value: "STAFF", label: "Staff" },
                      { value: "ADMIN", label: "Admin" },
                    ]} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer">
                  {language === "vi" ? "Tao tai khoan" : "Create Account"}
                </button>
                <button type="button" onClick={() => setIsAddingUser(false)}
                  className="bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer">
                  {language === "vi" ? "Huy" : "Cancel"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pr-4">{language === "vi" ? "Ho va ten" : "Name"}</th>
                <th className="pb-3 px-4">Email</th>
                <th className="pb-3 px-4">Password</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4 text-center">Permissions</th>
                <th className="pb-3 pl-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
              {accounts.map((acc) => (
                <tr key={acc.email} className="hover:bg-warm-50/50 transition-colors">
                  <td className="py-4 pr-4 text-warm-900 font-bold">
                    <div className="flex items-center gap-2">
                      {acc.role === "ADMIN" ? (
                        <span className="p-1.5 bg-warm-200 text-warm-850 rounded-lg"><Shield className="h-3.5 w-3.5" /></span>
                      ) : (
                        <span className="p-1.5 bg-jotun-teal/10 text-jotun-teal rounded-lg"><User className="h-3.5 w-3.5" /></span>
                      )}
                      {acc.name}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-warm-600">{acc.email}</td>
                  <td className="py-4 px-4 font-mono text-warm-500">
                    <div className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-warm-400 shrink-0" />
                      <span>{acc.password}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {acc.role === "ADMIN" ? (
                      <span className="px-2.5 py-1 bg-warm-200 text-warm-800 text-[10px] font-bold rounded-lg">ADMIN</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-jotun-teal/10 text-jotun-teal text-[10px] font-bold rounded-lg">CUSTOMER</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CustomSelect
                      value={acc.role}
                      onValueChange={(value) => handleUpdateRole(acc.id, value)}
                      options={[
                        { value: "CUSTOMER", label: "Customer" },
                        { value: "STAFF", label: "Staff" },
                        { value: "ADMIN", label: "Admin" },
                      ]}
                    />
                  </td>
                  <td className="py-4 pl-4 text-center">
                    <button onClick={() => triggerDeleteAccount(acc.id)}
                      className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer">
                      {language === "vi" ? "Xóa" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAccountToDelete(null);
        }}
        onConfirm={confirmDeleteAccount}
        title={language === "vi" ? "Xóa tài khoản?" : "Delete Account?"}
        message={
          language === "vi"
            ? `Bạn có chắc muốn xóa tài khoản ${accountToDelete} không?`
            : `Are you sure you want to delete user account ${accountToDelete}?`
        }
      />
    </motion.div>
  );
}
