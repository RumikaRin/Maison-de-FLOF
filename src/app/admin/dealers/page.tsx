"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { MapPin, Search, Plus, Trash2, Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";

const LocationPreviewMap = dynamic(() => import("@/components/maps/location-preview-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs font-medium text-warm-450">
      Đang tải bản đồ...
    </div>
  ),
});

interface Dealer {
  id: string;
  name: string;
  nameEn: string;
  phone: string;
  email: string;
  address: string;
  addressEn: string;
  province: string;
  district: string;
  brand: string;
  lng: number;
  lat: number;
}

export default function AdminDealersPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // States
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvince, setFilterProvince] = useState("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dealerToDelete, setDealerToDelete] = useState<string | null>(null);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [formName, setFormName] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formAddressEn, setFormAddressEn] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProvince, setFormProvince] = useState("Hà Nội");
  const [formDistrict, setFormDistrict] = useState("");
  const [formBrand, setFormBrand] = useState("Jotun");
  const [formLng, setFormLng] = useState<number>(105.8016);
  const [formLat, setFormLat] = useState<number>(21.0267);

  useEffect(() => {
    fetch("/api/admin/dealers")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải đại lý");
        setDealers(data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  // Filter & Search
  const filteredDealers = dealers.filter((dl) => {
    const matchesSearch =
      dl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dl.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dl.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dl.addressEn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince = filterProvince === "all" || dl.province === filterProvince;

    return matchesSearch && matchesProvince;
  });

  const openAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormName("");
    setFormNameEn("");
    setFormAddress("");
    setFormAddressEn("");
    setFormPhone("");
    setFormEmail("");
    setFormProvince("Hà Nội");
    setFormDistrict("");
    setFormBrand("Jotun");
    setFormLng(105.8016);
    setFormLat(21.0267);
    setIsModalOpen(true);
  };

  const openEditModal = (dl: Dealer) => {
    setModalMode("edit");
    setEditingId(dl.id);
    setFormName(dl.name);
    setFormNameEn(dl.nameEn);
    setFormAddress(dl.address);
    setFormAddressEn(dl.addressEn);
    setFormPhone(dl.phone);
    setFormEmail(dl.email || "");
    setFormProvince(dl.province);
    setFormDistrict(dl.district || "");
    setFormBrand(dl.brand || "Jotun");
    setFormLng(dl.lng);
    setFormLat(dl.lat);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formNameEn || !formAddress || !formAddressEn || !formPhone || !formLng || !formLat || !formProvince || !formDistrict) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ các trường thông tin." : "Please fill in all required inputs."
      );
      return;
    }

    const updatedDealer: Dealer = {
      id: modalMode === "add" ? `dl-${Date.now()}` : editingId || `dl-${Date.now()}`,
      name: formName,
      nameEn: formNameEn,
      address: formAddress,
      addressEn: formAddressEn,
      phone: formPhone,
      email: formEmail,
      province: formProvince,
      district: formDistrict,
      brand: formBrand,
      lng: Number(formLng),
      lat: Number(formLat),
    };

    const response = await fetch("/api/admin/dealers", {
      method: modalMode === "add" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updatedDealer, id: modalMode === "edit" ? editingId : undefined }),
    });
    const saved = await response.json();
    if (!response.ok) {
      toast.error(saved.error || "Không thể lưu đại lý");
      return;
    }
    setDealers((current) =>
      modalMode === "add"
        ? [...current, saved]
        : current.map((dealer) => (dealer.id === saved.id ? saved : dealer)),
    );
    toast.success(
      modalMode === "add"
        ? language === "vi" ? "Đã thêm chi nhánh mới thành công!" : "New branch added successfully!"
        : language === "vi" ? "Đã cập nhật thông tin chi nhánh!" : "Branch updated successfully!",
    );
    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setDealerToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!dealerToDelete) return;
    const target = dealers.find((dl) => dl.id === dealerToDelete);
    const response = await fetch(`/api/admin/dealers?id=${encodeURIComponent(dealerToDelete)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa đại lý");
      return;
    }
    setDealers((current) => current.filter((dealer) => dealer.id !== dealerToDelete));
    toast.success(
      language === "vi" ? `Đã xóa chi nhánh "${target?.name || ""}" thành công.` : "Branch deleted successfully."
    );
    setDealerToDelete(null);
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header and Add CTA with spring reveal */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold font-serif text-warm-900">
            {language === "vi" ? "Quản Lý Chi Nhánh & Đại Lý" : "Branches & Dealers"}
          </h1>
          <p className="text-warm-550 text-xs mt-1">
            {language === "vi"
              ? "Cập nhật thông tin địa chỉ, số hotline và định vị GPS chi nhánh hiển thị trên trang chủ."
              : "Update address, hotline, and GPS coordinate data for branches rendered on the storefront map."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-warm-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-warm-800 transition-colors flex items-center justify-center gap-1.5 self-start shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {language === "vi" ? "Thêm Chi Nhánh Mới" : "Add New Branch"}
        </button>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-warm-450 opacity-60" />
          </span>
          <input
            type="text"
            placeholder={
              language === "vi" ? "Tìm theo tên đại lý, địa chỉ..." : "Search by name, address..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow"
          />
        </div>

        <CustomSelect
          value={filterProvince}
          onValueChange={setFilterProvince}
          options={[
            { value: "all", label: language === "vi" ? "Tất cả khu vực" : "All Regions" },
            { value: "Hà Nội", label: language === "vi" ? "Hà Nội" : "Hanoi" },
            { value: "Hồ Chí Minh", label: language === "vi" ? "TP. Hồ Chí Minh" : "Ho Chi Minh City" },
            { value: "Đà Nẵng", label: language === "vi" ? "Đà Nẵng" : "Da Nang" },
          ]}
        />
      </motion.div>

      {/* Dealers table */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px] bg-warm-50/50">
                <th className="py-3.5 px-6">{language === "vi" ? "Chi nhánh / Đại lý" : "Branch / Dealer"}</th>
                <th className="py-3.5 px-4">{language === "vi" ? "Khu vực / Thương hiệu" : "Region / Brand"}</th>
                <th className="py-3.5 px-4">{language === "vi" ? "Địa chỉ" : "Address"}</th>
                <th className="py-3.5 px-4">{language === "vi" ? "Liên hệ" : "Contact"}</th>
                <th className="py-3.5 px-4">{language === "vi" ? "Tọa độ GPS" : "GPS Coordinates"}</th>
                <th className="py-3.5 pr-6 text-right">{language === "vi" ? "Hành động" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
              {filteredDealers.length === 0 ? (
                <tr key="empty">
                  <td colSpan={6} className="py-10 text-center text-warm-450 font-medium">
                    {language === "vi" ? "Không tìm thấy chi nhánh nào." : "No branches found."}
                  </td>
                </tr>
              ) : (
                filteredDealers.map((dl) => (
                  <tr key={dl.id} className="hover:bg-warm-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-warm-900 block text-xs">
                          {language === "vi" ? dl.name : dl.nameEn}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-warm-150 text-warm-800 border border-warm-250">
                        {dl.province}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-jotun-teal/10 text-jotun-teal border border-jotun-teal/20">
                        {dl.brand || "Jotun"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-warm-600 max-w-xs truncate" title={language === "vi" ? dl.address : dl.addressEn}>
                      {language === "vi" ? dl.address : dl.addressEn}
                    </td>
                    <td className="py-4 px-4 text-warm-700 font-mono text-[11px]">
                      <div>{dl.phone}</div>
                      {dl.email && <div className="text-[10px] text-warm-450 font-normal">{dl.email}</div>}
                    </td>
                    <td className="py-4 px-4 text-warm-500 font-mono text-[10px]">
                      Lng: {dl.lng.toFixed(4)} <br /> Lat: {dl.lat.toFixed(4)}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(dl)}
                          className="text-[11px] font-bold text-white bg-warm-900 hover:bg-warm-800 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-warm-900 cursor-pointer"
                          title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                        >
                          {language === "vi" ? "Sửa" : "Edit"}
                        </button>
                        <button
                          onClick={() => triggerDelete(dl.id)}
                          className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer"
                          title={language === "vi" ? "Xóa" : "Delete"}
                        >
                          {language === "vi" ? "Xóa" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal with premium spring scale/fade overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs cursor-pointer p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-warm-150 overflow-hidden flex flex-col md:flex-row max-h-[90vh] cursor-default"
            >
              {/* Left Form Panel */}
              <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-warm-100 pb-3">
                  <h3 className="font-serif font-bold text-lg text-warm-900">
                    {modalMode === "add"
                      ? (language === "vi" ? "Thêm Chi Nhánh Mới" : "Add New Branch")
                      : (language === "vi" ? "Cập Nhật Chi Nhánh" : "Edit Branch")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-warm-400 hover:text-warm-900 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Tên chi nhánh (Vi)</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="VD: Đại Lý Sơn Cầu Giấy..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Tên chi nhánh (En)</label>
                    <input
                      type="text"
                      required
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      placeholder="VD: Cau Giay Paint Shop..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Thành phố / Tỉnh</label>
                    <CustomSelect
                      value={formProvince}
                      onValueChange={(val) => {
                        setFormProvince(val);
                        // Set default coords depending on city to make visual map easier
                        if (val === "Hà Nội" && formLng === 106.6994) {
                          setFormLng(105.8016);
                          setFormLat(21.0267);
                        } else if (val === "Hồ Chí Minh" && formLng === 105.8016) {
                          setFormLng(106.6994);
                          setFormLat(10.7728);
                        } else if (val === "Đà Nẵng") {
                          setFormLng(108.2215);
                          setFormLat(16.0601);
                        }
                      }}
                      options={[
                        { value: "Hà Nội", label: "Hà Nội" },
                        { value: "Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
                        { value: "Đà Nẵng", label: "Đà Nẵng" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Quận / Huyện</label>
                    <input
                      type="text"
                      required
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      placeholder="VD: Cầu Giấy, Quận 1..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Thương hiệu phân phối</label>
                    <CustomSelect
                      value={formBrand}
                      onValueChange={setFormBrand}
                      options={[
                        { value: "Jotun", label: "Jotun" },
                        { value: "Dulux", label: "Dulux" },
                        { value: "Nippon Paint", label: "Nippon Paint" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Số điện thoại / Hotline</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="VD: 1800 1511..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Email liên hệ</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="VD: contact@dealer.vn..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Địa chỉ (Tiếng Việt)</label>
                    <input
                      type="text"
                      required
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="VD: Số 15 Cầu Giấy, Láng Thượng, Hà Nội..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Địa chỉ (Tiếng Anh)</label>
                    <input
                      type="text"
                      required
                      value={formAddressEn}
                      onChange={(e) => setFormAddressEn(e.target.value)}
                      placeholder="VD: 15 Cau Giay, Lang Thuong, Hanoi..."
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Kinh độ (Longitude - Lng)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formLng}
                      onChange={(e) => setFormLng(Number(e.target.value))}
                      placeholder="VD: 105.8016"
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Vĩ độ (Latitude - Lat)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formLat}
                      onChange={(e) => setFormLat(Number(e.target.value))}
                      placeholder="VD: 21.0267"
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850 font-mono"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="mt-6 flex justify-end gap-3 border-t border-warm-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-200 rounded-xl text-warm-900 transition-colors cursor-pointer"
                  >
                    {language === "vi" ? "Hủy bỏ" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-warm-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-warm-800 transition-colors cursor-pointer"
                  >
                    {modalMode === "add"
                      ? (language === "vi" ? "Thêm mới" : "Add Branch")
                      : (language === "vi" ? "Lưu thay đổi" : "Save Changes")}
                  </button>
                </div>
              </form>

              {/* Right Map Preview Panel */}
              <div className="w-full md:w-[360px] bg-warm-50 border-t md:border-t-0 md:border-l border-warm-150 flex flex-col p-6 gap-4 shrink-0">
                <div>
                  <h4 className="font-bold text-xs text-warm-900 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-jotun-teal" />
                    {language === "vi" ? "Xem trước vị trí bản đồ" : "GPS Live Map Preview"}
                  </h4>
                  <p className="text-[10px] text-warm-550 mt-1">
                    {language === "vi"
                      ? "Bản đồ hiển thị dựa trên tọa độ kinh/vĩ độ bạn đã nhập phía bên trái."
                      : "Map updates automatically based on the longitude and latitude fields."}
                  </p>
                </div>

                <div className="flex-grow min-h-[220px] rounded-xl overflow-hidden border border-warm-200 shadow-inner relative bg-white">
                  {formLng && formLat ? (
                    <LocationPreviewMap longitude={formLng} latitude={formLat} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-warm-450 font-medium">
                      {language === "vi" ? "Đang đợi tọa độ..." : "Waiting for coordinates..."}
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-warm-200 text-[10px] flex flex-col gap-1 font-semibold text-warm-800">
                  <span className="text-warm-450 font-bold block uppercase text-[9px] mb-1">
                    {language === "vi" ? "Chi tiết tọa độ" : "GPS Details"}
                  </span>
                  <div>
                    <span className="text-warm-500">Khu vực:</span> {formProvince}
                  </div>
                  <div>
                    <span className="text-warm-500">Kinh độ (Lng):</span> <span className="font-mono text-warm-900">{formLng}</span>
                  </div>
                  <div>
                    <span className="text-warm-500">Vĩ độ (Lat):</span> <span className="font-mono text-warm-900">{formLat}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDealerToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={language === "vi" ? "Xóa chi nhánh?" : "Delete Branch?"}
        message={
          language === "vi"
            ? `Bạn có chắc chắn muốn xóa chi nhánh "${dealers.find((dl) => dl.id === dealerToDelete)?.name || ""}"? Thao tác này sẽ cập nhật trực tiếp trên bản đồ trang chủ.`
            : `Are you sure you want to delete branch "${dealers.find((dl) => dl.id === dealerToDelete)?.nameEn || ""}"? This will immediately update the main store map.`
        }
      />
    </div>
  );
}
