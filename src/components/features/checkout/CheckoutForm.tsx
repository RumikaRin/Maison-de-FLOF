"use client";

import { CustomSelect } from "@/components/ui/custom-select";
import { User, Phone, MapPin, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/csp-toast";

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
  return (
    <div className="lg:col-span-7">
      <div className="bg-white dark:bg-zinc-950 border border-border p-6 rounded-xl shadow-sm flex flex-col gap-6">
        <h2 className="text-xl font-bold font-serif flex items-center gap-2 border-b border-border pb-3">
          <MapPin className="h-5 w-5 text-jotun-teal" />
          {language === "vi" ? "Thông tin giao hàng" : "Shipping Details"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Saved Address Book Selector */}
          {savedAddresses.length > 0 && (
            <div className="flex flex-col gap-2 p-4 bg-warm-50/50 rounded-xl border border-warm-200/60 text-left mb-2">
              <label className="text-[10px] font-bold uppercase text-warm-700 tracking-wider mb-1">
                {language === "vi" ? "Chọn từ địa chỉ đã lưu" : "Select from saved addresses"}
              </label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-full-name" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {language === "vi" ? "Họ và tên" : "Full Name"} <span className="text-red-500">*</span>
              </label>
              <input
                id="checkout-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === "vi" ? "Nguyễn Văn A..." : "John Doe..."}
                className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-phone" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {language === "vi" ? "Số điện thoại" : "Phone"} <span className="text-red-500">*</span>
              </label>
              <input
                id="checkout-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678..."
                className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="checkout-email" className="text-xs font-bold uppercase text-muted-foreground">
              Email
            </label>
            <input
              id="checkout-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com..."
              className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-province" className="text-xs font-bold uppercase text-muted-foreground">
                {language === "vi" ? "Tỉnh / Thành phố" : "Province / City"} <span className="text-red-500">*</span>
              </label>
              <input
                id="checkout-province"
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={language === "vi" ? "Hà Nội, TP.HCM..." : "Hanoi..."}
                className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-district" className="text-xs font-bold uppercase text-muted-foreground">
                {language === "vi" ? "Quận / Huyện" : "District"} <span className="text-red-500">*</span>
              </label>
              <input
                id="checkout-district"
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={language === "vi" ? "Cầu Giấy, Quận 1..." : "District..."}
                className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="checkout-address" className="text-xs font-bold uppercase text-muted-foreground">
              {language === "vi" ? "Địa chỉ nhận hàng (Số nhà, đường...)" : "Address"} <span className="text-red-500">*</span>
            </label>
            <input
              id="checkout-address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={language === "vi" ? "Số 12, Ngõ 34, Phố Huế..." : "123 Street..."}
              className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="checkout-notes" className="text-xs font-bold uppercase text-muted-foreground">
              {language === "vi" ? "Ghi chú đơn hàng" : "Order Notes"}
            </label>
            <textarea
              id="checkout-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === "vi" ? "Lời nhắn cho người giao hàng..." : "Delivery notes..."}
              className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm resize-none"
            />
          </div>

          {/* Payment selection */}
          <div className="mt-4 flex flex-col gap-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-jotun-teal" />
              {language === "vi" ? "Phương thức thanh toán" : "Payment Method"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-lg border text-left flex flex-col gap-1.5 transition-all ${
                  paymentMethod === "COD"
                    ? "border-jotun-teal ring-2 ring-jotun-teal bg-jotun-teal/5"
                    : "border-border hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <span className="text-sm font-bold text-foreground">
                  {language === "vi" ? "Thanh toán khi nhận hàng (COD)" : "Cash on Delivery"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-normal">
                  {language === "vi" ? "Thanh toán tiền mặt khi nhân viên bưu điện giao hàng trực tiếp." : "Pay with cash upon delivery."}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("TRANSFER")}
                className={`p-4 rounded-lg border text-left flex flex-col gap-1.5 transition-all ${
                  paymentMethod === "TRANSFER"
                    ? "border-jotun-teal ring-2 ring-jotun-teal bg-jotun-teal/5"
                    : "border-border hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <span className="text-sm font-bold text-foreground">
                  {language === "vi" ? "Chuyển khoản ngân hàng" : "Bank Transfer"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-normal">
                  {language === "vi" ? "Nhận thông tin tài khoản, quét mã QR và chờ nhân viên đối soát." : "Scan QR code and transfer. Waiting for confirmation."}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("VNPAY")}
                className={`p-4 rounded-lg border text-left flex flex-col gap-1.5 transition-all md:col-span-2 ${
                  paymentMethod === "VNPAY"
                    ? "border-jotun-teal ring-2 ring-jotun-teal bg-jotun-teal/5"
                    : "border-border hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {language === "vi" ? "Thanh toán qua VNPay" : "Pay with VNPay"}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-normal">
                  {language === "vi" ? "Thanh toán an toàn qua cổng VNPay (hỗ trợ thẻ ATM, Visa, Master, QR Code)." : "Secure payment via VNPay gateway."}
                </span>
                
                {paymentMethod === "VNPAY" && process.env.NODE_ENV === "development" && (
                  <div className="mt-2 bg-yellow-50/50 p-2 border border-yellow-200 rounded text-xs text-yellow-800">
                    <p className="font-bold">Môi trường Test (Sandbox):</p>
                    <p>Ngân hàng: NCB</p>
                    <p>Số thẻ: 9704198526191432198</p>
                    <p>Tên in trên thẻ: NGUYEN VAN A</p>
                    <p>Ngày phát hành: 07/15 - OTP: 123456</p>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Submit Checkout button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-warm-900 text-white font-bold py-4 rounded-md hover:bg-warm-800 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2 text-sm mt-4"
          >
            {isSubmitting
              ? language === "vi"
                ? "Đang đặt hàng..."
                : "Placing Order..."
              : language === "vi" ? "Đặt Hàng" : "Place Order"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
