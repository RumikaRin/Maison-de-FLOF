"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useTrans } from "@/lib/dictionary";
import { PALETTE_COLORS } from "@/lib/color-utils";
import { ColorDetailDrawer } from "@/components/ui/color-detail-drawer";


interface UserSession {
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
}

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = useTrans(language);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "profile" | "password" | "addresses" | "favorites">("history");
  const [wishlistColors, setWishlistColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);

  // Profile Form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("0900000001");
  const [profileAddress, setProfileAddress] = useState("15 Cầu Giấy, Hà Nội");

  // Password Form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [orders, setOrders] = useState<any[]>([]);

  // Address book state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [addrId, setAddrId] = useState("");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrLine, setAddrLine] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  const { data: authSession, status: authStatus } = useSession();

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("sonvn-user");
    let currentUserEmail = "";
    let currentUserName = "";

    const authUser = authSession?.user;
    const authRole = (authUser as any)?.role;

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      currentUserEmail = parsed.email || "";
      currentUserName = parsed.name || "";
      setProfileName(parsed.name || "");
      setProfileEmail(parsed.email || "");
      if (parsed.phone) setProfilePhone(parsed.phone);
      if (parsed.address) setProfileAddress(parsed.address);
    } else if (authUser) {
      const sessionUser = {
        email: authUser.email || "",
        name: authUser.name || "",
        role: authRole || "CUSTOMER",
      };
      setUser(sessionUser);
      currentUserEmail = sessionUser.email;
      currentUserName = sessionUser.name;
      setProfileName(sessionUser.name);
      setProfileEmail(sessionUser.email);
    } else {
      if (authStatus !== "loading") router.push("/login");
      return;
    }

    // Load dynamic orders filtered by email
    const storedOrders = localStorage.getItem("sonvn-orders");
    if (storedOrders) {
      try {
        const allOrders = JSON.parse(storedOrders);
        setOrders(allOrders.filter((ord: any) => ord.userEmail === currentUserEmail));
      } catch (e) {
        setOrders([]);
      }
    }

    if (currentUserEmail) {
      fetch(`/api/orders?email=${encodeURIComponent(currentUserEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const localOrders = localStorage.getItem("sonvn-orders");
            let ordersArray: any[] = [];
            if (localOrders) {
              try { ordersArray = JSON.parse(localOrders); } catch (e) {}
            }

            // Merge database orders with local storage orders, keeping unique IDs
            const merged = [...data];
            const currentUserLocalOrders = ordersArray.filter((o: any) => o.userEmail === currentUserEmail);
            currentUserLocalOrders.forEach((localOrd) => {
              if (!merged.some((dbOrd) => dbOrd.id === localOrd.id)) {
                merged.push(localOrd);
              }
            });

            // Sort merged orders by date/id descending
            merged.sort((a, b) => {
              const dateA = a.date || "";
              const dateB = b.date || "";
              if (dateA !== dateB) return dateB.localeCompare(dateA);
              return b.id.localeCompare(a.id);
            });

            setOrders(merged);

            const otherUsersOrders = ordersArray.filter((o: any) => o.userEmail !== currentUserEmail);
            localStorage.setItem("sonvn-orders", JSON.stringify([...merged, ...otherUsersOrders]));
          }
        })
        .catch((err) => console.error("Error loading orders from DB API:", err));
    }

    // Load dynamic addresses scoped by email
    const storedAddresses = localStorage.getItem(`sonvn-addresses-${currentUserEmail}`);
    let loadedAddresses: any[] = [];
    if (storedAddresses) {
      try {
        loadedAddresses = JSON.parse(storedAddresses);
        setAddresses(loadedAddresses);
      } catch (e) {
        setAddresses([]);
      }
    } else {
      // Load initial mock address
      loadedAddresses = [
        {
          id: "addr-1",
          name: currentUserName || "Nguyễn Văn Khách",
          phone: "0900000001",
          province: "Hà Nội",
          district: "Cầu Giấy",
          address: "15 Cầu Giấy, Hà Nội",
          isDefault: true
        }
      ];
      localStorage.setItem(`sonvn-addresses-${currentUserEmail}`, JSON.stringify(loadedAddresses));
      setAddresses(loadedAddresses);
    }

    // Sync profileAddress from default address
    const defaultAddr = loadedAddresses.find((a: any) => a.isDefault);
    if (defaultAddr) {
      const addrStr = [defaultAddr.address, defaultAddr.district, defaultAddr.province].filter(Boolean).join(", ");
      setProfileAddress(addrStr);
    }

    const savedColors = localStorage.getItem("sonvn-color-wishlist");
    if (savedColors) {
      try {
        setWishlistColors(JSON.parse(savedColors));
      } catch (e) { }
    }

    if (currentUserEmail) {
      fetch(`/api/profile/favorites?email=${encodeURIComponent(currentUserEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setWishlistColors(data);
            localStorage.setItem("sonvn-color-wishlist", JSON.stringify(data));
          }
        })
        .catch((err) => console.error("Error loading profile favorites:", err));
    }
  }, [router]);

  if (!mounted) return null;
  if (!user) return null;

  const handleToggleFavoriteColor = (code: string) => {
    let updated: string[];
    if (wishlistColors.includes(code)) {
      updated = wishlistColors.filter(c => c !== code);
      toast.success(language === "vi" ? "Đã xóa màu khỏi danh sách yêu thích!" : "Removed color from favorites!");
    } else {
      updated = [...wishlistColors, code];
      toast.success(language === "vi" ? "Đã thêm màu vào danh sách yêu thích!" : "Added color to favorites!");
    }
    setWishlistColors(updated);
    localStorage.setItem("sonvn-color-wishlist", JSON.stringify(updated));

    // Sync toggle with database backend
    if (user && user.email) {
      fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, code })
      }).catch((err) => console.error("Error toggling favorite in DB:", err));
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      toast.error(language === "vi" ? "Vui lòng điền đầy đủ Tên và Email" : "Please fill in Name and Email");
      return;
    }
    const updatedUser = {
      ...user,
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      address: profileAddress
    };
    setUser(updatedUser as any);
    localStorage.setItem("sonvn-user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("sonvn-user-update"));

    toast.success(language === "vi" ? "Cập nhật thông tin thành công!" : "Profile updated successfully!");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(language === "vi" ? "Vui lòng nhập đầy đủ thông tin" : "Please fill in all fields");
      return;
    }
    if (oldPassword !== "123456") {
      toast.error(language === "vi" ? "Mật khẩu cũ không chính xác" : "Incorrect old password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === "vi" ? "Mật khẩu mới không trùng khớp" : "New passwords do not match");
      return;
    }
    toast.success(language === "vi" ? "Đổi mật khẩu thành công!" : "Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const syncProfileAddressFromDefault = (addrs: any[]) => {
    const def = addrs.find((a: any) => a.isDefault);
    if (def) {
      setProfileAddress([def.address, def.district, def.province].filter(Boolean).join(", "));
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrProvince || !addrDistrict || !addrLine) {
      toast.error(language === "vi" ? "Vui lòng nhập đầy đủ thông tin địa chỉ" : "Please fill in all fields");
      return;
    }

    let updatedAddresses = [...addresses];

    if (addrIsDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    }

    const newAddressObj = {
      id: addrId || `addr-${Date.now()}`,
      name: addrName,
      phone: addrPhone,
      province: addrProvince,
      district: addrDistrict,
      address: addrLine,
      isDefault: addrIsDefault || (addresses.length === 0)
    };

    if (addrId) {
      updatedAddresses = updatedAddresses.map(addr => addr.id === addrId ? newAddressObj : addr);
      toast.success(language === "vi" ? "Đã cập nhật địa chỉ thành công!" : "Address updated successfully!");
    } else {
      updatedAddresses.push(newAddressObj);
      toast.success(language === "vi" ? "Đã thêm địa chỉ mới thành công!" : "New address added successfully!");
    }

    if (updatedAddresses.length === 1) {
      updatedAddresses[0].isDefault = true;
    }

    setAddresses(updatedAddresses);
    const userEmail = user?.email || "guest";
    localStorage.setItem(`sonvn-addresses-${userEmail}`, JSON.stringify(updatedAddresses));
    syncProfileAddressFromDefault(updatedAddresses);

    setIsAddingAddr(false);
    setAddrId("");
    setAddrName("");
    setAddrPhone("");
    setAddrProvince("");
    setAddrDistrict("");
    setAddrLine("");
    setAddrIsDefault(false);
  };

  const handleEditAddress = (addr: any) => {
    setAddrId(addr.id);
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrProvince(addr.province);
    setAddrDistrict(addr.district);
    setAddrLine(addr.address);
    setAddrIsDefault(addr.isDefault);
    setIsAddingAddr(true);
  };

  const handleDeleteAddress = (id: string) => {
    const target = addresses.find(a => a.id === id);
    let updatedAddresses = addresses.filter(addr => addr.id !== id);

    if (target?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    setAddresses(updatedAddresses);
    const userEmail = user?.email || "guest";
    localStorage.setItem(`sonvn-addresses-${userEmail}`, JSON.stringify(updatedAddresses));
    syncProfileAddressFromDefault(updatedAddresses);
    toast.success(language === "vi" ? "Đã xóa địa chỉ thành công!" : "Address deleted successfully!");
  };

  const handleSetDefaultAddress = (id: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setAddresses(updatedAddresses);
    const userEmail = user?.email || "guest";
    localStorage.setItem(`sonvn-addresses-${userEmail}`, JSON.stringify(updatedAddresses));
    syncProfileAddressFromDefault(updatedAddresses);
    toast.success(language === "vi" ? "Đã đặt địa chỉ mặc định!" : "Default address updated!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
            {language === "vi" ? "Đã nhận hàng" : "Delivered"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
            {language === "vi" ? "Đang vận chuyển" : "Delivering"}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-500 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
            {status}
          </span>
        );
    }
  };



  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-12 bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column sidebar settings */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-4 bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col gap-4 sm:gap-6"
        >
          <div className="flex items-center gap-4 border-b border-warm-100 pb-4 sm:pb-5">
            <div className="h-14 w-14 bg-jotun-teal/10 text-jotun-teal rounded-full flex items-center justify-center font-bold text-lg border border-jotun-teal/20 shadow-sm shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <h2 className="font-serif font-bold text-lg text-warm-900 leading-tight">{user.name}</h2>
              <span className="text-xs text-warm-500 block font-mono mt-0.5">{user.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 lg:gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-full">
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center justify-between px-3.5 py-2.5 lg:p-3 rounded-xl hover:bg-warm-900 hover:text-white text-warm-900 border border-warm-200 transition-all bg-warm-50/50 lg:mb-2 shadow-sm focus:outline-none col-span-2 lg:col-span-1 text-center justify-center lg:justify-between"
              >
                <span>{language === "vi" ? "Trang quản trị Admin" : "Admin Dashboard"}</span>
                <span className="hidden lg:inline">→</span>
              </Link>
            )}

            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
                activeTab === "history"
                  ? "bg-warm-900 text-white shadow-sm"
                  : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
              )}
            >
              <span>{language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
                activeTab === "profile"
                  ? "bg-warm-900 text-white shadow-sm"
                  : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
              )}
            >
              <span>{language === "vi" ? "Thông tin cá nhân" : "Personal Settings"}</span>
            </button>

            <button
              onClick={() => setActiveTab("password")}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
                activeTab === "password"
                  ? "bg-warm-900 text-white shadow-sm"
                  : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
              )}
            >
              <span>{language === "vi" ? "Đổi mật khẩu" : "Change Password"}</span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-1",
                activeTab === "addresses"
                  ? "bg-warm-900 text-white shadow-sm"
                  : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
              )}
            >
              <span>{language === "vi" ? "Sổ địa chỉ" : "Address Book"}</span>
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={cn(
                "flex items-center justify-center lg:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-center lg:text-left transition-colors duration-200 focus:outline-none col-span-2 lg:col-span-1",
                activeTab === "favorites"
                  ? "bg-warm-900 text-white shadow-sm"
                  : "text-warm-700 hover:bg-warm-100/50 hover:text-warm-900"
              )}
            >
              <span>{language === "vi" ? "Màu sắc đã lưu" : "Saved Colors"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 lg:p-3 rounded-xl text-red-500 hover:bg-red-500/10 text-left transition-colors duration-200 lg:mt-4 border border-red-500/10 bg-red-500/[0.02] shrink-0 whitespace-nowrap focus:outline-none"
            >
              <span>{language === "vi" ? "Đăng xuất" : "Log Out"}</span>
            </button>
          </div>
        </motion.aside>

        {/* Right column settings panels */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="lg:col-span-8 flex flex-col gap-6"
        >
          
            {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
            <div className="bezel-outer">
              <div className="bezel-inner p-4 sm:p-6 text-left shadow-sm">
                <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
                  {language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}
                </h3>

                {orders.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 border border-warm-200/80 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-warm-50/20 hover:bg-warm-50 hover:border-warm-350 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-jotun-teal text-sm">{ord.id}</span>
                            {getStatusBadge(ord.status)}
                          </div>
                          <p className="text-warm-800 mt-1.5 leading-relaxed font-semibold">
                            {typeof ord.items === "string"
                              ? ord.items
                              : Array.isArray(ord.items)
                                ? ord.items.map((i: any) => typeof i === "string" ? i : `${i.paint?.name || i.name || (language === "vi" ? "Sản phẩm" : "Paint")} x ${i.quantity || 1}`).join(", ")
                                : JSON.stringify(ord.items || "")}
                          </p>
                          <span className="text-[10px] text-warm-500 flex items-center gap-1 mt-1 font-mono">
                            {ord.date}
                          </span>
                        </div>

                        <div className="text-left sm:text-right font-mono shrink-0">
                          <span className="text-[10px] text-warm-500 block">
                            {language === "vi" ? "Tổng tiền" : "Total amount"}
                          </span>
                          <span className="font-bold text-base text-warm-900">
                            {formatPrice(ord.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-10 text-warm-500">
                    {language === "vi" ? "Bạn chưa thực hiện đơn hàng nào." : "You have no orders yet."}
                  </div>
                )}
              </div>
            </div>
            </motion.div>
            )}

            {activeTab === "profile" && (
            <div className="bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm text-left">
              <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
                {language === "vi" ? "Thông tin cá nhân" : "Personal Settings"}
              </h3>

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Họ và tên</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder="Họ và tên"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">
                      {language === "vi" ? "Địa chỉ Email (Không thể thay đổi)" : "Email Address (Read-only)"}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileEmail}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50/70 text-xs font-semibold text-warm-500 cursor-not-allowed opacity-80 focus:outline-hidden"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Số điện thoại</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder="Số điện thoại"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Địa chỉ nhận hàng</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder="Địa chỉ"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold px-6 py-3 mt-2 rounded-xl transition-all shadow-sm self-start"
                >
                  Lưu thay đổi
                </button>
              </form>
            </div>
          )}

          {activeTab === "password" && (
            <motion.div
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

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Mật khẩu cũ</label>
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
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Mật khẩu mới</label>
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
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
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
                  Cập nhật mật khẩu
                </button>
              </form>
              </div>
              </motion.div>
            )}

            {activeTab === "addresses" && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
            <div className="bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-warm-100 pb-3 mb-6">
                <h3 className="font-serif font-bold text-lg text-[#88734C]">
                  {language === "vi" ? "Sổ địa chỉ nhận hàng" : "Address Book"}
                </h3>
                {!isAddingAddr && (
                  <button
                    onClick={() => {
                      setAddrId("");
                      setAddrName("");
                      setAddrPhone("");
                      setAddrProvince("");
                      setAddrDistrict("");
                      setAddrLine("");
                      setAddrIsDefault(false);
                      setIsAddingAddr(true);
                    }}
                    className="bg-warm-900 hover:bg-warm-850 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    + {language === "vi" ? "Thêm địa chỉ mới" : "Add New Address"}
                  </button>
                )}
              </div>

              {isAddingAddr ? (
                <form onSubmit={handleSaveAddress} className="flex flex-col gap-4">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-warm-500">
                    {addrId ? (language === "vi" ? "Chỉnh sửa địa chỉ" : "Edit Address") : (language === "vi" ? "Thêm địa chỉ mới" : "Add New Address")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Họ và tên người nhận</label>
                      <input
                        type="text"
                        required
                        value={addrName}
                        onChange={(e) => setAddrName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder={language === "vi" ? "Nguyễn Văn A" : "John Doe"}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder="0912345678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Tỉnh / Thành phố</label>
                      <input
                        type="text"
                        required
                        value={addrProvince}
                        onChange={(e) => setAddrProvince(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder={language === "vi" ? "Hà Nội" : "Hanoi"}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Quận / Huyện</label>
                      <input
                        type="text"
                        required
                        value={addrDistrict}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                        placeholder={language === "vi" ? "Cầu Giấy" : "Cau Giay"}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Địa chỉ chi tiết (Số nhà, đường...)</label>
                    <input
                      type="text"
                      required
                      value={addrLine}
                      onChange={(e) => setAddrLine(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                      placeholder={language === "vi" ? "Số 15 Cầu Giấy" : "15 Cau Giay street"}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="addrIsDefault"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                      className="h-4 w-4 rounded border-warm-300 text-jotun-teal focus:ring-jotun-teal"
                    />
                    <label htmlFor="addrIsDefault" className="text-xs font-semibold text-warm-700">
                      {language === "vi" ? "Đặt làm địa chỉ mặc định" : "Set as default address"}
                    </label>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      className="bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs"
                    >
                      {language === "vi" ? "Lưu địa chỉ" : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddr(false)}
                      className="bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold px-6 py-2.5 rounded-xl transition-all"
                    >
                      {language === "vi" ? "Hủy" : "Cancel"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  {addresses.length > 0 ? (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 sm:p-5 border rounded-2xl flex flex-col sm:flex-row justify-between sm:items-start gap-4 transition-all duration-300 ${addr.isDefault
                            ? "border-warm-900 bg-warm-900/[0.02] shadow-sm"
                            : "border-warm-200/80 bg-warm-50/10 hover:bg-warm-50/50"
                          }`}
                      >
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-warm-900">{addr.name}</span>
                            <span className="text-xs text-warm-550 font-mono font-semibold">{addr.phone}</span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 bg-warm-900/10 text-warm-900 text-[9px] font-bold rounded">
                                {language === "vi" ? "Mặc định" : "Default"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-warm-700 leading-relaxed font-medium">
                            {addr.address}, {addr.district}, {addr.province}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-bold mt-2 sm:mt-0">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-warm-900 hover:underline px-2 py-1 text-left"
                            >
                              {language === "vi" ? "Thiết lập mặc định" : "Set Default"}
                            </button>
                          )}
                          <button
                            onClick={() => handleEditAddress(addr)}
                            className="text-warm-700 hover:text-warm-900 px-2 py-1 border border-warm-200 hover:border-warm-300 rounded-lg bg-white shadow-xs"
                          >
                            {language === "vi" ? "Sửa" : "Edit"}
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-500 hover:text-red-700 px-2 py-1 border border-red-100 hover:border-red-200 rounded-lg bg-red-500/[0.02]"
                          >
                            {language === "vi" ? "Xóa" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-10 text-warm-550 text-xs">
                      {language === "vi" ? "Bạn chưa lưu địa chỉ nào." : "You have no saved addresses."}
                    </div>
                  )}
              </div>
            )}
            </div>
            </motion.div>
            )}

            {activeTab === "favorites" && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
            <div className="bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm text-left">
              <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
                {language === "vi" ? "Màu sắc đã lưu" : "Saved Colors"}
              </h3>

              {wishlistColors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wishlistColors.map((code) => {
                    const color = PALETTE_COLORS.find(c => c.code === code);
                    if (!color) return null;
                    return (
                      <div
                        key={color.code}
                        onClick={() => setSelectedColor(color)}
                        className="bg-white rounded-2xl border border-warm-200 p-3 flex flex-col gap-3 group relative hover:shadow-md transition-all duration-300 cursor-pointer"
                      >
                        <div
                          className="h-24 rounded-xl border border-black/5 flex items-center justify-center relative shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavoriteColor(color.code);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full shadow-sm text-rose-500 hover:scale-110 transition-all duration-200 flex items-center justify-center"
                            title={language === "vi" ? "Bỏ thích" : "Unlike"}
                          >
                            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                          </button>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-warm-400 font-mono tracking-wider block">MÃ: {color.code}</span>
                          <h4 className="font-bold text-xs text-warm-900 truncate mt-0.5">
                            {language === "vi" ? color.name : (color.nameEn || color.name)}
                          </h4>
                          <span className="text-[10px] font-mono text-warm-550 block mt-0.5">{color.hex}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-10 text-warm-500 text-sm">
                  {language === "vi" ? "Bạn chưa lưu màu sắc nào." : "You have no saved colors."}
                  <div className="mt-4">
                    <Link href="/colors" className="text-jotun-teal font-bold hover:underline">
                      {language === "vi" ? "Khám phá bảng màu ngay" : "Explore Color Palette"}
                    </Link>
                  </div>
</div>
              )}
              </div>
            </motion.div>
          )}

          {/* Color Detail Side Panel */}
          <ColorDetailDrawer
            selectedColor={selectedColor}
            onClose={() => setSelectedColor(null)}
            favorites={wishlistColors}
            onToggleFavorite={handleToggleFavoriteColor}
            language={language}
          />

      </motion.div>
    </div>
  </div>
  );
}
