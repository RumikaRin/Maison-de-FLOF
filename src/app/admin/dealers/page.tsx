"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { Map, MapMarker, MarkerContent } from "@/components/ui/mapcn-marker-tooltip";
import { MapPin, Search, Plus, Trash2, Edit2, X } from "lucide-react";

interface Dealer {
  name: string;
  nameEn: string;
  address: string;
  addressEn: string;
  phone: string;
  lng: number;
  lat: number;
}

type DealersState = Record<"hanoi" | "hcm", Dealer[]>;

interface TableDealer extends Dealer {
  cityKey: "hanoi" | "hcm";
  indexInCity: number;
}

const FALLBACK_DEALERS: DealersState = {
  "hanoi": [
    {
      name: "Đại Lý Sơn Cầu Giấy",
      nameEn: "Cau Giay Paint Dealer",
      address: "Số 15 Cầu Giấy, Láng Thượng, Hà Nội",
      addressEn: "15 Cau Giay, Lang Thuong, Hanoi",
      phone: "1800 1511",
      lng: 105.8016,
      lat: 21.0267
    },
    {
      name: "Trung Tâm Pha Màu Jotun Mỹ Đình",
      nameEn: "My Dinh Jotun Tinting Center",
      address: "28 Lê Đức Thọ, Mỹ Đình, Hà Nội",
      addressEn: "28 Le Duc Tho, My Dinh, Hanoi",
      phone: "0900 000 001",
      lng: 105.7725,
      lat: 21.0286
    }
  ],
  "hcm": [
    {
      name: "Thế Giới Sơn Sài Gòn Q1",
      nameEn: "Saigon Paint World District 1",
      address: "88 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
      addressEn: "88 Le Loi, Ben Thanh Ward, District 1, HCMC",
      phone: "0911 222 333",
      lng: 106.6994,
      lat: 10.7728
    },
    {
      name: "Đại Lý Sơn Jotun Dulux Thủ Đức",
      nameEn: "Thu Duc Jotun & Dulux Paint Shop",
      address: "420 Võ Văn Ngân, Bình Thọ, Thủ Đức, TP.HCM",
      addressEn: "420 Vo Van Ngân, Binh Tho, Thu Duc, HCMC",
      phone: "0933 444 555",
      lng: 106.7722,
      lat: 10.8492
    }
  ]
};

export default function AdminDealersPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // States
  const [dealers, setDealers] = useState<DealersState>(FALLBACK_DEALERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("all");

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCityKey, setEditingCityKey] = useState<"hanoi" | "hcm" | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form States
  const [formName, setFormName] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formAddressEn, setFormAddressEn] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState<"hanoi" | "hcm">("hanoi");
  const [formLng, setFormLng] = useState<number>(105.8);
  const [formLat, setFormLat] = useState<number>(21.0);

  // Load from local storage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sonvn-dealers");
    if (stored) {
      try {
        setDealers(JSON.parse(stored));
      } catch (e) {
        setDealers(FALLBACK_DEALERS);
      }
    } else {
      localStorage.setItem("sonvn-dealers", JSON.stringify(FALLBACK_DEALERS));
      setDealers(FALLBACK_DEALERS);
    }
  }, []);

  if (!mounted) return null;

  // Flatten dealers object for table
  const allDealers: TableDealer[] = [];
  (["hanoi", "hcm"] as const).forEach((cityKey) => {
    const list = dealers[cityKey] || [];
    list.forEach((dl, index) => {
      allDealers.push({
        ...dl,
        cityKey,
        indexInCity: index,
      });
    });
  });

  // Filter & Search
  const filteredDealers = allDealers.filter((dl) => {
    const matchesSearch =
      dl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dl.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dl.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dl.addressEn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = filterCity === "all" || dl.cityKey === filterCity;

    return matchesSearch && matchesCity;
  });

  const saveToLocalStorage = (nextState: DealersState) => {
    setDealers(nextState);
    localStorage.setItem("sonvn-dealers", JSON.stringify(nextState));
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingCityKey(null);
    setEditingIndex(null);
    setFormName("");
    setFormNameEn("");
    setFormAddress("");
    setFormAddressEn("");
    setFormPhone("");
    setFormCity("hanoi");
    setFormLng(105.8016);
    setFormLat(21.0267);
    setIsModalOpen(true);
  };

  const openEditModal = (dl: TableDealer) => {
    setModalMode("edit");
    setEditingCityKey(dl.cityKey);
    setEditingIndex(dl.indexInCity);
    setFormName(dl.name);
    setFormNameEn(dl.nameEn);
    setFormAddress(dl.address);
    setFormAddressEn(dl.addressEn);
    setFormPhone(dl.phone);
    setFormCity(dl.cityKey);
    setFormLng(dl.lng);
    setFormLat(dl.lat);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formNameEn || !formAddress || !formAddressEn || !formPhone || !formLng || !formLat) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ các trường thông tin." : "Please fill in all inputs."
      );
      return;
    }

    const newDealer: Dealer = {
      name: formName,
      nameEn: formNameEn,
      address: formAddress,
      addressEn: formAddressEn,
      phone: formPhone,
      lng: Number(formLng),
      lat: Number(formLat),
    };

    let nextState = { ...dealers };

    if (modalMode === "add") {
      // Add to selected city
      nextState[formCity] = [...(nextState[formCity] || []), newDealer];
      toast.success(
        language === "vi" ? "Đã thêm chi nhánh mới thành công!" : "New branch added successfully!"
      );
    } else {
      // Edit
      if (editingCityKey && editingIndex !== null) {
        // If city changed
        if (editingCityKey !== formCity) {
          // Remove from old city list
          nextState[editingCityKey] = nextState[editingCityKey].filter((_, i) => i !== editingIndex);
          // Add to new city list
          nextState[formCity] = [...(nextState[formCity] || []), newDealer];
        } else {
          // Update in same city list
          nextState[formCity] = nextState[formCity].map((dl, i) =>
            i === editingIndex ? newDealer : dl
          );
        }
        toast.success(
          language === "vi" ? "Đã cập nhật thông tin chi nhánh!" : "Branch updated successfully!"
        );
      }
    }

    saveToLocalStorage(nextState);
    setIsModalOpen(false);
  };

  const handleDelete = (cityKey: "hanoi" | "hcm", index: number) => {
    const confirmMsg =
      language === "vi"
        ? "Bạn chắc chắn muốn xóa chi nhánh này? Thao tác này sẽ cập nhật trực tiếp trên bản đồ trang chủ."
        : "Are you sure you want to delete this branch? This updates the homepage map immediately.";

    if (confirm(confirmMsg)) {
      let nextState = { ...dealers };
      nextState[cityKey] = nextState[cityKey].filter((_, i) => i !== index);
      saveToLocalStorage(nextState);
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
          <h1 className="text-3xl font-bold font-serif">
            {language === "vi" ? "Quản Lý Chi Nhánh & Đại Lý" : "Branches & Dealers"}
          </h1>
          <p className="text-muted-foreground text-xs">
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
          value={filterCity}
          onValueChange={setFilterCity}
          options={[
            { value: "all", label: language === "vi" ? "Tất cả khu vực" : "All Regions" },
            { value: "hanoi", label: language === "vi" ? "Hà Nội" : "Hanoi" },
            { value: "hcm", label: language === "vi" ? "TP. Hồ Chí Minh" : "Ho Chi Minh City" },
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
                <th className="py-3.5 px-4">{language === "vi" ? "Khu vực" : "Region"}</th>
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
                filteredDealers.map((dl, idx) => (
                  <tr key={idx} className="hover:bg-warm-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-warm-900 block text-xs">
                          {language === "vi" ? dl.name : dl.nameEn}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${dl.cityKey === "hanoi"
                          ? "bg-warm-150 text-warm-800 border border-warm-250"
                          : "bg-jotun-teal/10 text-jotun-teal border border-jotun-teal/20"
                        }`}>
                        {dl.cityKey === "hanoi" ? "Hà Nội" : "TP.HCM"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-warm-600 max-w-xs truncate" title={language === "vi" ? dl.address : dl.addressEn}>
                      {language === "vi" ? dl.address : dl.addressEn}
                    </td>
                    <td className="py-4 px-4 text-warm-700 font-mono text-[11px]">{dl.phone}</td>
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
                          onClick={() => handleDelete(dl.cityKey, dl.indexInCity)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-warm-150 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

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
                  <label className="text-[10px] font-bold uppercase text-warm-450">Khu vực / Thành phố</label>
                  <CustomSelect
                    value={formCity}
                    onValueChange={(val) => {
                      setFormCity(val as any);
                      // Set default coords depending on city to make visual map easier
                      if (val === "hanoi" && formLng === 106.6994) {
                        setFormLng(105.8016);
                        setFormLat(21.0267);
                      } else if (val === "hcm" && formLng === 105.8016) {
                        setFormLng(106.6994);
                        setFormLat(10.7728);
                      }
                    }}
                    options={[
                      { value: "hanoi", label: language === "vi" ? "Hà Nội" : "Hanoi" },
                      { value: "hcm", label: language === "vi" ? "TP. Hồ Chí Minh" : "Ho Chi Minh City" },
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
                  <span className="text-warm-500">Khu vực:</span> {formCity === "hanoi" ? "Hà Nội" : "TP. Hồ Chí Minh"}
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
