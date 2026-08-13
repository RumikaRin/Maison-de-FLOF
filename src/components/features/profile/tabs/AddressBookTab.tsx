/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressSelect } from "@/components/ui/address-select";
import { Rule } from "@/components/ui/editorial";
import { loadVnProvinces, type VnProvince } from "@/lib/vn-address";
import type { ProfileAddress } from "../types";

interface AddressBookTabProps {
  language: string;
  addresses: ProfileAddress[];
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
  handleEditAddress: (addr: ProfileAddress) => void;
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
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadVnProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {
        // Stored values still display on the trigger; saving stays possible
        // once the list loads on a retry visit.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const wardOptions = useMemo(
    () => provinces.find((p) => p.n === addrProvince)?.w ?? [],
    [provinces, addrProvince],
  );

  return (
    <section className="text-left">
      <div className="flex flex-wrap items-end justify-between gap-fl-sm">
        <h2 className="fl-display text-fl-xl">
          {language === "vi" ? "Sổ địa chỉ nhận hàng" : "Address Book"}
        </h2>
        {!isAddingAddr && (
          <Button
            variant="outline"
            size="sm"
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
          >
            + {language === "vi" ? "Thêm địa chỉ mới" : "Add New Address"}
          </Button>
        )}
      </div>
      <Rule weight="strong" className="mt-fl-xs" />

      {isAddingAddr ? (
        <form onSubmit={handleSaveAddress} className="mt-fl-md flex flex-col gap-fl-sm">
          <p className="fl-label">
            {addrId ? (language === "vi" ? "Chỉnh sửa địa chỉ" : "Edit Address") : (language === "vi" ? "Thêm địa chỉ mới" : "Add New Address")}
          </p>
          <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="addr-name">Họ và tên người nhận</Label>
              <Input
                id="addr-name"
                type="text"
                required
                value={addrName}
                onChange={(e) => setAddrName(e.target.value)}
                placeholder={language === "vi" ? "Nguyễn Văn A" : "John Doe"}
              />
            </div>
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="addr-phone">Số điện thoại</Label>
              <Input
                id="addr-phone"
                type="tel"
                required
                value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="addr-province">Tỉnh / Thành phố</Label>
              <AddressSelect
                id="addr-province"
                value={addrProvince}
                onValueChange={(next) => {
                  setAddrProvince(next);
                  if (next !== addrProvince) setAddrDistrict("");
                }}
                options={provinces.map((p) => p.n)}
                placeholder={language === "vi" ? "Chọn tỉnh / thành phố" : "Select province / city"}
                searchPlaceholder={language === "vi" ? "Tìm tỉnh / thành phố..." : "Search province..."}
                emptyLabel={language === "vi" ? "Không tìm thấy" : "No match"}
              />
            </div>
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="addr-district">Phường / Xã</Label>
              <AddressSelect
                id="addr-district"
                disabled={!addrProvince}
                value={addrDistrict}
                onValueChange={setAddrDistrict}
                options={wardOptions}
                placeholder={
                  !addrProvince
                    ? language === "vi" ? "Chọn tỉnh / thành phố trước" : "Select a province first"
                    : language === "vi" ? "Chọn phường / xã" : "Select ward"
                }
                searchPlaceholder={language === "vi" ? "Tìm phường / xã..." : "Search ward..."}
                emptyLabel={language === "vi" ? "Không tìm thấy" : "No match"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="addr-line">Địa chỉ chi tiết (Số nhà, đường...)</Label>
            <Input
              id="addr-line"
              type="text"
              required
              value={addrLine}
              onChange={(e) => setAddrLine(e.target.value)}
              placeholder={language === "vi" ? "Số 15 Cầu Giấy" : "15 Cau Giay street"}
            />
          </div>

          <label
            htmlFor="addrIsDefault"
            className="flex min-h-11 cursor-pointer items-center gap-fl-2xs text-fl-sm text-atelier-ink md:min-h-6"
          >
            <input
              type="checkbox"
              id="addrIsDefault"
              checked={addrIsDefault}
              onChange={(e) => setAddrIsDefault(e.target.checked)}
              className="h-4 w-4 accent-atelier-accent"
            />
            {language === "vi" ? "Đặt làm địa chỉ mặc định" : "Set as default address"}
          </label>

          <div className="mt-fl-2xs flex gap-fl-sm">
            <Button type="submit">
              {language === "vi" ? "Lưu địa chỉ" : "Save Address"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsAddingAddr(false)}>
              {language === "vi" ? "Hủy" : "Cancel"}
            </Button>
          </div>
        </form>
      ) : (
        <ul>
          {addresses.length > 0 ? (
            addresses.map((addr) => (
              <li
                key={addr.id}
                className="flex flex-col justify-between gap-fl-sm border-b border-atelier-rule py-fl-sm sm:flex-row sm:items-start"
              >
                <div className="flex min-w-0 flex-col gap-fl-3xs text-left">
                  <div className="flex flex-wrap items-baseline gap-x-fl-sm gap-y-fl-3xs">
                    <span className="text-fl-sm font-medium text-atelier-ink">{addr.name}</span>
                    <span className="text-fl-xs tabular-nums text-atelier-ink-2">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="fl-label text-atelier-accent">
                        {language === "vi" ? "Mặc định" : "Default"}
                      </span>
                    )}
                  </div>
                  <p className="text-fl-sm leading-relaxed text-atelier-ink-2">
                    {addr.address}, {addr.district}, {addr.province}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-x-fl-sm gap-y-fl-3xs">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="min-h-11 whitespace-nowrap text-fl-xs font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                    >
                      {language === "vi" ? "Thiết lập mặc định" : "Set Default"}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditAddress(addr)}
                    className="min-h-11 whitespace-nowrap text-fl-xs font-medium text-atelier-ink underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                  >
                    {language === "vi" ? "Sửa" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="min-h-11 whitespace-nowrap text-fl-xs font-medium text-atelier-danger underline decoration-1 underline-offset-4 transition-opacity duration-fl-fast ease-fl-out hover:opacity-80 md:min-h-6"
                  >
                    {language === "vi" ? "Xóa" : "Delete"}
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="list-none py-fl-lg text-fl-sm text-atelier-ink-2">
              {language === "vi" ? "Bạn chưa lưu địa chỉ nào." : "You have no saved addresses."}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
