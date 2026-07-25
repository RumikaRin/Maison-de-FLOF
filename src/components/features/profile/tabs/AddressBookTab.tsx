"use client";

import { safeMotion } from "@/components/ui/motion-safe";

interface AddressBookTabProps {
  language: string;
  addresses: any[];
  isAddingAddr: boolean;
  setIsAddingAddr: (val: boolean) => void;
  addrId: string;
  setAddrId: (val: string) => void;
  addrName: string;
  setAddrName: (val: string) => void;
  addrPhone: string;
  setAddrPhone: (val: string) => void;
  addrProvince: string;
  setAddrProvince: (val: string) => void;
  addrDistrict: string;
  setAddrDistrict: (val: string) => void;
  addrLine: string;
  setAddrLine: (val: string) => void;
  addrIsDefault: boolean;
  setAddrIsDefault: (val: boolean) => void;
  handleSaveAddress: (e: React.FormEvent) => void;
  handleEditAddress: (addr: any) => void;
  handleDeleteAddress: (id: string) => void;
  handleSetDefaultAddress: (id: string) => void;
}

export function AddressBookTab({
  language,
  addresses,
  isAddingAddr,
  setIsAddingAddr,
  addrId,
  setAddrId,
  addrName,
  setAddrName,
  addrPhone,
  setAddrPhone,
  addrProvince,
  setAddrProvince,
  addrDistrict,
  setAddrDistrict,
  addrLine,
  setAddrLine,
  addrIsDefault,
  setAddrIsDefault,
  handleSaveAddress,
  handleEditAddress,
  handleDeleteAddress,
  handleSetDefaultAddress,
}: AddressBookTabProps) {
  return (
    <safeMotion.div
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
    </safeMotion.div>
  );
}

