"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { ColorDetailDrawer } from "@/components/ui/color-detail-drawer";
import { ProfileSidebar } from "./ProfileSidebar";
import { OrderHistoryTab } from "./tabs/OrderHistoryTab";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { PasswordTab } from "./tabs/PasswordTab";
import { AddressBookTab } from "./tabs/AddressBookTab";
import { SavedColorsTab } from "./tabs/SavedColorsTab";

interface UserSession {
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
}

export function ProfileClient() {
  const router = useRouter();
  const { language } = useLanguageStore();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "profile" | "password" | "addresses" | "favorites">("history");
  const [wishlistColors, setWishlistColors] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
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

  function syncProfileAddressFromDefault(addrs: any[]) {
    const defaultAddress = addrs.find((address: any) => address.isDefault);
    if (defaultAddress) {
      setProfileAddress(
        [defaultAddress.address, defaultAddress.district, defaultAddress.province]
          .filter(Boolean)
          .join(", "),
      );
    }
  }

  useEffect(() => {
    setMounted(true);
    if (authStatus === "loading") return;
    if (!authSession?.user?.email) {
      router.push("/login");
      return;
    }

    const fetchJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
      }
    };

    // Fetch primary user profile first to render the page quickly
    fetchJson("/api/profile").then((profile) => {
      if (profile) {
        setUser(profile);
        setProfileName(profile.name || "");
        setProfileEmail(profile.email || "");
        setProfilePhone(profile.phone || "");
      }
    });

    // Fetch other data in parallel without blocking user profile
    Promise.all([
      fetchJson("/api/orders"),
      fetchJson("/api/profile/addresses"),
      fetchJson("/api/profile/favorites"),
      fetchJson("/api/profile/favorite-products"),
    ]).then(([dbOrders, dbAddresses, favorites, favoriteProducts]) => {
      if (Array.isArray(dbOrders)) setOrders(dbOrders);
      if (Array.isArray(dbAddresses)) {
        setAddresses(dbAddresses);
        syncProfileAddressFromDefault(dbAddresses);
      }
      if (Array.isArray(favorites)) setWishlistColors(favorites);
      if (Array.isArray(favoriteProducts)) setWishlistProducts(favoriteProducts);
    });
  }, [router, authSession, authStatus]);

  if (!mounted) return null;
  if (!user) return null;

  const handleToggleFavoriteColor = async (code: string) => {
    const previous = wishlistColors;
    let updated: string[];
    if (previous.includes(code)) {
      updated = previous.filter(c => c !== code);
      toast.success(language === "vi" ? "Đã xóa màu khỏi danh sách yêu thích!" : "Removed color from favorites!");
    } else {
      updated = [...previous, code];
      toast.success(language === "vi" ? "Đã thêm màu vào danh sách yêu thích!" : "Added color to favorites!");
    }
    setWishlistColors(updated);

    try {
      const response = await fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error("Không thể cập nhật danh sách yêu thích");
    } catch (error) {
      setWishlistColors(previous);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật danh sách yêu thích");
    }
  };

  const handleRemoveFavoriteProduct = async (paintId: string) => {
    const previous = wishlistProducts;
    setWishlistProducts((products) => products.filter((product) => product.id !== paintId));
    try {
      const response = await fetch("/api/profile/favorite-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paintId }),
      });
      if (!response.ok) throw new Error("Không thể xóa sản phẩm yêu thích");
    } catch (error) {
      setWishlistProducts(previous);
      toast.error(error instanceof Error ? error.message : "Không thể xóa sản phẩm yêu thích");
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: window.location.origin });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      toast.error(language === "vi" ? "Vui lòng điền đầy đủ Tên và Email" : "Please fill in Name and Email");
      return;
    }
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật hồ sơ");
      setUser(data);
      toast.success(language === "vi" ? "Cập nhật thông tin thành công!" : "Profile updated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(language === "vi" ? "Vui lòng nhập đầy đủ thông tin" : "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === "vi" ? "Mật khẩu mới không trùng khớp" : "New passwords do not match");
      return;
    }
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể đổi mật khẩu");
      toast.success(language === "vi" ? "Đổi mật khẩu thành công!" : "Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đổi mật khẩu");
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrProvince || !addrDistrict || !addrLine) {
      toast.error(language === "vi" ? "Vui lòng nhập đầy đủ thông tin địa chỉ" : "Please fill in all fields");
      return;
    }

    const addressInput = {
      id: addrId || undefined,
      name: addrName,
      phone: addrPhone,
      province: addrProvince,
      district: addrDistrict,
      address: addrLine,
      isDefault: addrIsDefault || addresses.length === 0,
    };

    try {
      const response = await fetch("/api/profile/addresses", {
        method: addrId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressInput),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Không thể lưu địa chỉ");
      const refreshed = await fetch("/api/profile/addresses").then((res) => res.json());
      setAddresses(refreshed);
      syncProfileAddressFromDefault(refreshed);
      toast.success(
        addrId
          ? language === "vi" ? "Đã cập nhật địa chỉ thành công!" : "Address updated successfully!"
          : language === "vi" ? "Đã thêm địa chỉ mới thành công!" : "New address added successfully!",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu địa chỉ");
      return;
    }

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

  const handleDeleteAddress = async (id: string) => {
    const response = await fetch(`/api/profile/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa địa chỉ");
      return;
    }
    const refreshed = await fetch("/api/profile/addresses").then((res) => res.json());
    setAddresses(refreshed);
    syncProfileAddressFromDefault(refreshed);
    toast.success(language === "vi" ? "Đã xóa địa chỉ thành công!" : "Address deleted successfully!");
  };

  const handleSetDefaultAddress = async (id: string) => {
    const address = addresses.find((item) => item.id === id);
    if (!address) return;
    const response = await fetch("/api/profile/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...address, isDefault: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể cập nhật địa chỉ");
      return;
    }
    const refreshed = await fetch("/api/profile/addresses").then((res) => res.json());
    setAddresses(refreshed);
    syncProfileAddressFromDefault(refreshed);
    toast.success(language === "vi" ? "Đã đặt địa chỉ mặc định!" : "Default address updated!");
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-12 bg-jotun-ivory text-warm-900 transition-colors duration-300 min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column sidebar settings */}
        <ProfileSidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          language={language}
          handleLogout={handleLogout}
        />

        {/* Right column settings panels */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="lg:col-span-8 flex flex-col gap-6"
        >
          {activeTab === "history" && (
            <OrderHistoryTab orders={orders} language={language} />
          )}

          {activeTab === "profile" && (
            <PersonalInfoTab
              language={language}
              wishlistProducts={wishlistProducts}
              handleRemoveFavoriteProduct={handleRemoveFavoriteProduct}
              profileName={profileName}
              setProfileName={setProfileName}
              profileEmail={profileEmail}
              profilePhone={profilePhone}
              setProfilePhone={setProfilePhone}
              profileAddress={profileAddress}
              setProfileAddress={setProfileAddress}
              handleProfileSubmit={handleProfileSubmit}
            />
          )}

          {activeTab === "password" && (
            <PasswordTab
              language={language}
              oldPassword={oldPassword}
              setOldPassword={setOldPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              handlePasswordSubmit={handlePasswordSubmit}
            />
          )}

          {activeTab === "addresses" && (
            <AddressBookTab
              language={language}
              addresses={addresses}
              isAddingAddr={isAddingAddr}
              setIsAddingAddr={setIsAddingAddr}
              addrId={addrId}
              setAddrId={setAddrId}
              addrName={addrName}
              setAddrName={setAddrName}
              addrPhone={addrPhone}
              setAddrPhone={setAddrPhone}
              addrProvince={addrProvince}
              setAddrProvince={setAddrProvince}
              addrDistrict={addrDistrict}
              setAddrDistrict={setAddrDistrict}
              addrLine={addrLine}
              setAddrLine={setAddrLine}
              addrIsDefault={addrIsDefault}
              setAddrIsDefault={setAddrIsDefault}
              handleSaveAddress={handleSaveAddress}
              handleEditAddress={handleEditAddress}
              handleDeleteAddress={handleDeleteAddress}
              handleSetDefaultAddress={handleSetDefaultAddress}
            />
          )}

          {activeTab === "favorites" && (
            <SavedColorsTab
              language={language}
              wishlistColors={wishlistColors}
              handleToggleFavoriteColor={handleToggleFavoriteColor}
              setSelectedColor={setSelectedColor}
            />
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
