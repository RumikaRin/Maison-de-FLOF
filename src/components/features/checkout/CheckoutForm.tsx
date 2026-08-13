/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { AddressSelect } from "@/components/ui/address-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/csp-toast";
import { loadVnProvinces, type VnProvince } from "@/lib/vn-address";

interface CheckoutFormProps {
  language: string;
  savedAddresses: any[];
  selectedAddrId: string;
  setSelectedAddrId: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  province: string;
  setProvince: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  paymentMethod: "COD" | "TRANSFER" | "VNPAY";
  setPaymentMethod: (val: "COD" | "TRANSFER" | "VNPAY") => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function CheckoutForm({
  language,
  savedAddresses,
  selectedAddrId,
  setSelectedAddrId,
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  province,
  setProvince,
  district,
  setDistrict,
  address,
  setAddress,
  notes,
  setNotes,
  paymentMethod,
  setPaymentMethod,
  handleSubmit,
  isSubmitting,
}: CheckoutFormProps) {
  // 34 provinces + wards (post-2025-merger official units). Loaded lazily from
  // a cached static JSON; until it arrives the selects show an empty list.
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadVnProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {
        // Network hiccup: the trigger still shows any stored value, and the
        // submit-side validation is unchanged, so checkout stays usable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const wardOptions = useMemo(
    () => provinces.find((p) => p.n === province)?.w ?? [],
    [provinces, province],
  );

  const paymentOptions: Array<{
    value: "COD" | "TRANSFER" | "VNPAY";
    title: string;
    note: string;
    recommended?: boolean;
  }> = [
    {
      value: "COD",
      title: language === "vi" ? "Thanh toán khi nhận hàng (COD)" : "Cash on Delivery",
      note:
        language === "vi"
          ? "Thanh toán tiền mặt khi nhân viên bưu điện giao hàng trực tiếp."
          : "Pay with cash upon delivery.",
    },
    {
      value: "TRANSFER",
      title: language === "vi" ? "Chuyển khoản ngân hàng" : "Bank Transfer",
      note:
        language === "vi"
          ? "Nhận thông tin tài khoản, quét mã QR và chờ nhân viên đối soát."
          : "Scan QR code and transfer. Waiting for confirmation.",
    },
    {
      value: "VNPAY",
      title: language === "vi" ? "Thanh toán qua VNPay" : "Pay with VNPay",
      note:
        language === "vi"
          ? "Thanh toán an toàn qua cổng VNPay (hỗ trợ thẻ ATM, Visa, Master, QR Code)."
          : "Secure payment via VNPay gateway.",
      recommended: true,
    },
  ];

  return (
    <div className="lg:col-span-7">
      <h2 className="fl-display text-fl-xl">
        {language === "vi" ? "Thông tin giao hàng" : "Shipping details"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-fl-md flex flex-col gap-fl-sm">
        {/* Saved Address Book Selector */}
        {savedAddresses.length > 0 && (
          <div className="flex flex-col gap-fl-2xs border-b border-atelier-rule pb-fl-sm">
            <span className="text-fl-sm font-medium leading-none text-atelier-ink">
              {language === "vi" ? "Chọn từ địa chỉ đã lưu" : "Select from saved addresses"}
            </span>
            <CustomSelect
              value={selectedAddrId}
              onValueChange={(val) => {
                setSelectedAddrId(val);
                const addr = savedAddresses.find(a => a.id === val);
                if (addr) {
                  setFullName(addr.name);
                  setPhone(addr.phone);
                  setProvince(addr.province);
                  setDistrict(addr.district);
                  setAddress(addr.address);
                  toast.success(language === "vi" ? "Đã áp dụng địa chỉ giao hàng!" : "Applied delivery address!");
                }
              }}
              placeholder={language === "vi" ? "-- Chọn địa chỉ nhận hàng --" : "-- Select a shipping address --"}
              options={savedAddresses.map((addr: any) => ({
                value: addr.id,
                label: `${addr.name} - ${addr.phone} (${addr.address}, ${addr.district}, ${addr.province}) ${addr.isDefault ? `[${language === "vi" ? "Mặc định" : "Default"}]` : ""}`,
              }))}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="checkout-full-name">
              {language === "vi" ? "Họ và tên" : "Full Name"}{" "}
              <span aria-hidden="true" className="text-atelier-danger">*</span>
            </Label>
            <Input
              id="checkout-full-name"
              type="text"
              required
              aria-required="true"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={language === "vi" ? "Nguyễn Văn A" : "John Doe"}
            />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="checkout-phone">
              {language === "vi" ? "Số điện thoại" : "Phone"}{" "}
              <span aria-hidden="true" className="text-atelier-danger">*</span>
            </Label>
            <Input
              id="checkout-phone"
              type="tel"
              required
              aria-required="true"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
            />
          </div>
        </div>

        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="checkout-email">Email</Label>
          <Input
            id="checkout-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>

        <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="checkout-province">
              {language === "vi" ? "Tỉnh / Thành phố" : "Province / City"}{" "}
              <span aria-hidden="true" className="text-atelier-danger">*</span>
            </Label>
            <AddressSelect
              id="checkout-province"
              value={province}
              onValueChange={(next) => {
                setProvince(next);
                // A ward belongs to exactly one province; keeping the old one
                // across a province change would save a mismatched address.
                if (next !== province) setDistrict("");
              }}
              options={provinces.map((p) => p.n)}
              placeholder={language === "vi" ? "Chọn tỉnh / thành phố" : "Select province / city"}
              searchPlaceholder={language === "vi" ? "Tìm tỉnh / thành phố..." : "Search province..."}
              emptyLabel={language === "vi" ? "Không tìm thấy" : "No match"}
            />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="checkout-district">
              {/* The district tier was abolished in the 2025 administrative
                  reform — a current address is province + ward. The API field
                  keeps its historical name `district`. */}
              {language === "vi" ? "Phường / Xã" : "Ward / Commune"}{" "}
              <span aria-hidden="true" className="text-atelier-danger">*</span>
            </Label>
            <AddressSelect
              id="checkout-district"
              disabled={!province}
              value={district}
              onValueChange={setDistrict}
              options={wardOptions}
              placeholder={
                !province
                  ? language === "vi" ? "Chọn tỉnh / thành phố trước" : "Select a province first"
                  : language === "vi" ? "Chọn phường / xã" : "Select ward"
              }
              searchPlaceholder={language === "vi" ? "Tìm phường / xã..." : "Search ward..."}
              emptyLabel={language === "vi" ? "Không tìm thấy" : "No match"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="checkout-address">
            {language === "vi" ? "Địa chỉ nhận hàng (Số nhà, đường...)" : "Address"}{" "}
            <span aria-hidden="true" className="text-atelier-danger">*</span>
          </Label>
          <Input
            id="checkout-address"
            type="text"
            required
            aria-required="true"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={language === "vi" ? "Số 12, Ngõ 34, Phố Huế" : "123 Street"}
          />
        </div>

        <div className="flex flex-col gap-fl-2xs">
          <Label htmlFor="checkout-notes">
            {language === "vi" ? "Ghi chú đơn hàng" : "Order Notes"}
          </Label>
          <Textarea
            id="checkout-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={language === "vi" ? "Lời nhắn cho người giao hàng" : "Delivery notes"}
          />
        </div>

        {/* Payment selection — flat radio rows on hairline rules */}
        <fieldset className="mt-fl-md">
          <legend className="fl-display text-fl-lg">
            {language === "vi" ? "Phương thức thanh toán" : "Payment method"}
          </legend>
          <div className="mt-fl-xs border-t border-atelier-rule">
            {paymentOptions.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-start gap-fl-sm border-b border-atelier-rule py-fl-xs transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2"
              >
                <input
                  type="radio"
                  name="checkout-payment-method"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="mt-1 h-4 w-4 shrink-0 accent-atelier-accent"
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-fl-sm font-medium text-atelier-ink">
                    {option.title}
                    {option.recommended && (
                      <span className="fl-label ml-2 text-atelier-accent">
                        {language === "vi" ? "Khuyên dùng" : "Recommended"}
                      </span>
                    )}
                  </span>
                  <span className="text-fl-xs leading-normal text-atelier-ink-2">
                    {option.note}
                  </span>
                  {option.value === "VNPAY" &&
                    paymentMethod === "VNPAY" &&
                    process.env.NODE_ENV === "development" && (
                      <span className="mt-1 block border-l-2 border-atelier-rule-strong pl-fl-xs text-fl-xs text-atelier-ink-2">
                        <span className="block font-medium text-atelier-ink">Môi trường Test (Sandbox):</span>
                        <span className="block">Ngân hàng: NCB</span>
                        <span className="block tabular-nums">Số thẻ: 9704198526191432198</span>
                        <span className="block">Tên in trên thẻ: NGUYEN VAN A</span>
                        <span className="block tabular-nums">Ngày phát hành: 07/15 - OTP: 123456</span>
                      </span>
                    )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Submit Checkout button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          data-state={isSubmitting ? "loading" : undefined}
          className="mt-fl-sm w-full"
        >
          {isSubmitting
            ? language === "vi"
              ? "Đang đặt hàng..."
              : "Placing Order..."
            : language === "vi" ? "Đặt hàng" : "Place Order"}
        </Button>
      </form>
    </div>
  );
}
