"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { Map, MapMarker, MarkerContent } from "@/components/ui/mapcn-marker-tooltip";
import { MapPin, Search, Plus, Trash2, Edit2, X } from "lucide-react";

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

const FALLBACK_DEALERS: Dealer[] = [
  {
    id: "1",
    name: "Showroom Sơn FLOF Hà Nội",
    nameEn: "FLOF Hanoi Paint Boutique",
    phone: "0243123456",
    email: "hanoi@flof.vn",
    address: "Số 15 Cầu Giấy, Láng Thượng, Cầu Giấy",
    addressEn: "15 Cau Giay, Lang Thuong, Cau Giay",
    province: "Hà Nội",
    district: "Cầu Giấy",
    brand: "Jotun",
    lng: 105.8016,
    lat: 21.0267
  },
  {
    id: "2",
    name: "Trung Tâm Phối Màu Jotun Tây Hồ",
    nameEn: "Tay Ho Jotun Tinting Center",
    phone: "0243789456",
    email: "tayho@flof.vn",
    address: "Số 102 Lạc Long Quân, Bưởi, Tây Hồ",
    addressEn: "102 Lac Long Quan, Buoi, Tay Ho",
    province: "Hà Nội",
    district: "Tây Hồ",
    brand: "Jotun",
    lng: 105.8066,
    lat: 21.0664
  },
  {
    id: "3",
    name: "Đại Lý Sơn Dulux Quận 1",
    nameEn: "Dulux Paint Shop District 1",
    phone: "0283999888",
    email: "q1@flof.vn",
    address: "240 Trần Hưng Đạo, Nguyễn Cư Trinh, Quận 1",
    addressEn: "240 Tran Hung Dao, Nguyen Cu Trinh, District 1",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    brand: "Dulux",
    lng: 106.6894,
    lat: 10.7628
  },
  {
    id: "4",
    name: "Nhà Phân Phối Sơn Jotun Bình Thạnh",
    nameEn: "Binh Thanh Jotun Paint Distributor",
    phone: "0283511222",
    email: "binhthanh@flof.vn",
    address: "45 Điện Biên Phủ, Phường 15, Bình Thạnh",
    addressEn: "45 Dien Bien Phu, Ward 15, Binh Thanh",
    province: "Hồ Chí Minh",
    district: "Bình Thạnh",
    brand: "Jotun",
    lng: 106.7022,
    lat: 10.7992
  },
  {
    id: "5",
    name: "Đại Lý Sơn Nippon Đà Nẵng",
    nameEn: "Nippon Paint Da Nang Shop",
    phone: "02363555777",
    email: "danang@flof.vn",
    address: "98 Nguyễn Văn Linh, Nam Dương, Hải Châu",
    addressEn: "98 Nguyen Van Linh, Nam Duong, Hai Chau",
    province: "Đà Nẵng",
    district: "Hải Châu",
    brand: "Nippon Paint",
    lng: 108.2215,
    lat: 16.0601
  }
];

export default function AdminDealersPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // States
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvince, setFilterProvince] = useState("all");

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

  // Load from local storage and normalize if nested object
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sonvn-dealers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDealers(parsed);
        } else if (parsed && typeof parsed === "object") {
          // Normalise legacy Record<"hanoi" | "hcm", Dealer[]> format
          const flat: Dealer[] = [];
          (["hanoi", "hcm"] as const).forEach((cityKey) => {
            const list = (parsed as any)[cityKey] || [];
            list.forEach((dl: any, index: number) => {
              flat.push({
                id: dl.id || `dl-${cityKey}-${index}-${Date.now()}`,
                name: dl.name,
                nameEn: dl.nameEn || dl.name,
                phone: dl.phone,
                email: dl.email || "",
                address: dl.address,
                addressEn: dl.addressEn || dl.address,
                province: cityKey === "hanoi" ? "Hà Nội" : "Hồ Chí Minh",
                district: dl.district || (cityKey === "hanoi" ? "Cầu Giấy" : "Quận 1"),
                brand: dl.brand || "Jotun",
                lng: dl.lng,
                lat: dl.lat,
              });
            });
          });
          setDealers(flat);
          localStorage.setItem("sonvn-dealers", JSON.stringify(flat));
        } else {
          setDealers(FALLBACK_DEALERS);
        }
      } catch (e) {
        setDealers(FALLBACK_DEALERS);
      }
    } else {
      localStorage.setItem("sonvn-dealers", JSON.stringify(FALLBACK_DEALERS));
      setDealers(FALLBACK_DEALERS);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
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

    let nextState: Dealer[];

    if (modalMode === "add") {
      nextState = [...dealers, updatedDealer];
      toast.success(
        language === "vi" ? "Đã thêm chi nhánh mới thành công!" : "New branch added successfully!"
      );
    } else {
      nextState = dealers.map((dl) => dl.id === editingId ? updatedDealer : dl);
      toast.success(
        language === "vi" ? "Đã cập nhật thông tin chi nhánh!" : "Branch updated successfully!"
      );
    }

    setDealers(nextState);
    localStorage.setItem("sonvn-dealers", JSON.stringify(nextState));
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const confirmMsg =
      language === "vi"
        ? "Bạn chắc chắn muốn xóa chi nhánh này? Thao tác này sẽ cập nhật trực tiếp trên bản đồ trang chủ."
        : "Are you sure you want to delete this branch? This updates the homepage map immediately.";

    if (confirm(confirmMsg)) {
      const nextState = dealers.filter((dl) => dl.id !== id);
      setDealers(nextState);
      localStorage.setItem("sonvn-dealers", JSON.stringify(nextState));
      toast.success(
        language === "vi" ? "Đã xóa chi nhánh thành công." : "Branch deleted successfully."
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header and Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          className="bg-warm-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-warm-800 transition-colors flex items-center justify-center gap-1.5 self-start shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {language === "vi" ? "Thêm Chi Nhánh Mới" : "Add New Branch"}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Dealers table */}
      <div className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden">
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
                <tr>
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
                          className="text-[11px] font-bold text-white bg-warm-900 hover:bg-warm-800 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-warm-900"
                          title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                        >
                          {language === "vi" ? "Sửa" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleDelete(dl.id)}
                          className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-red-600"
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
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-warm-150 overflow-hidden flex flex-col md:flex-row max-h-[90vh] cursor-default">

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
                  className="text-warm-400 hover:text-warm-900 transition-colors"
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
                  className="px-5 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-200 rounded-xl text-warm-900 transition-colors"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-warm-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-warm-800 transition-colors"
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
                <p className="text-[10px] text-warm-500 mt-1">
                  {language === "vi"
                    ? "Bản đồ hiển thị dựa trên tọa độ kinh/vĩ độ bạn đã nhập phía bên trái."
                    : "Map updates automatically based on the longitude and latitude fields."}
                </p>
              </div>

              <div className="flex-grow min-h-[220px] rounded-xl overflow-hidden border border-warm-200 shadow-inner relative bg-white">
                {formLng && formLat ? (
                  <Map
                    viewport={{
                      center: [formLng, formLat],
                      zoom: 14,
                      bearing: 0,
                      pitch: 0
                    }}
                  >
                    <MapMarker longitude={formLng} latitude={formLat}>
                      <MarkerContent>
                        <div className="size-6 rounded-full border-2 border-white bg-jotun-teal shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                          <MapPin className="size-3.5 text-white" />
                        </div>
                      </MarkerContent>
                    </MapMarker>
                  </Map>
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

          </div>
        </div>
      )}
    </div>
  );
}
