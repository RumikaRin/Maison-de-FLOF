"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  User,
  ArrowRight,
  ChevronLeft,
  Copy,
  Info
} from "lucide-react";

// Wrapped component to use search params correctly in Next.js Suspense
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const { items, getCartTotal, clearCart } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [discountParam, setDiscountParam] = useState(0);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "TRANSFER">("COD");

  // Order status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState("");

  useEffect(() => {
    setMounted(true);
    const disc = searchParams.get("discount");
    if (disc) {
      setDiscountParam(Number(disc));
    }

    // Load saved addresses from localStorage scoped by logged in user's email
    const storedUser = localStorage.getItem("sonvn-user");
    let currentUserEmail = "guest";
    if (storedUser) {
      try {
        currentUserEmail = JSON.parse(storedUser).email || "guest";
      } catch (e) {}
    }

    const storedAddrs = localStorage.getItem(`sonvn-addresses-${currentUserEmail}`);
    if (storedAddrs) {
      try {
        const parsed = JSON.parse(storedAddrs);
        setSavedAddresses(parsed);
        // Pre-fill the default address if found
        const defaultAddr = parsed.find((a: any) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddrId(defaultAddr.id);
          setFullName(defaultAddr.name);
          setPhone(defaultAddr.phone);
          setProvince(defaultAddr.province);
          setDistrict(defaultAddr.district);
          setAddress(defaultAddr.address);
        }
      } catch (e) {}
    }
  }, [searchParams]);

  if (!mounted) return null;

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50000;
  const total = Math.max(0, subtotal + shippingFee - discountParam);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      language === "vi" ? "Đã sao chép vào bộ nhớ tạm." : "Copied to clipboard."
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phone || !address || !province || !district) {
      toast.error(
        language === "vi"
          ? "Vui lòng nhập đầy đủ thông tin giao hàng bắt buộc."
          : "Please fill in all required shipping fields."
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate database insertion delay
    setTimeout(() => {
      const generatedOrderNum = `SVN-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderNumber(generatedOrderNum);
      setIsSubmitting(false);
      setIsSuccess(true);

      // Save order to localStorage so Profile Page can track it!
      const itemsDescription = items.map(item => {
        const name = language === "vi" ? item.paint.name : item.paint.nameEn;
        const color = item.selectedColor ? `, ${language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn} (${item.selectedColor.code})` : "";
        return `${name} ${item.paint.volume}${item.paint.volumeUnit} x ${item.quantity}${color}`;
      }).join("; ");

      // Load user email to scope order
      const storedUser = localStorage.getItem("sonvn-user");
      let currentUserEmail = "guest";
      if (storedUser) {
        try {
          currentUserEmail = JSON.parse(storedUser).email || "guest";
        } catch (e) {}
      }

      const newOrder = {
        id: generatedOrderNum,
        date: new Date().toISOString().split('T')[0],
        userEmail: currentUserEmail,
        customer: fullName || "Nguyễn Văn Khách",
        items: itemsDescription || (language === "vi" ? "Đơn hàng sơn nước" : "Paint Order"),
        total: total,
        status: "PROCESSING"
      };

      const existingOrders = localStorage.getItem("sonvn-orders");
      let ordersArray = [];
      if (existingOrders) {
        try { ordersArray = JSON.parse(existingOrders); } catch (e) {}
      }
      ordersArray.unshift(newOrder); // Add to the top
      localStorage.setItem("sonvn-orders", JSON.stringify(ordersArray));

      // Sync order to database API
      if (currentUserEmail !== "guest") {
        fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentUserEmail,
            items: items.map((item: any) => ({
              paintId: item.paint.id,
              quantity: item.quantity,
              price: item.paint.price
            })),
            total: total,
            paymentMethod: paymentMethod === "COD" ? "COD" : "TRANSFER"
          })
        }).catch((err) => console.error("Error creating order in DB:", err));
      }

      clearCart();
      toast.success(
        language === "vi" ? "Đặt hàng thành công!" : "Order placed successfully!"
      );
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-2xl text-center flex flex-col items-center gap-8 animate-fade-in">
        <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg">
          <CheckCircle className="h-12 w-12" />
        </div>

        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">{t.orderSuccess}</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {language === "vi"
              ? "Cảm ơn bạn đã lựa chọn Maison de FLOF. Đơn hàng của bạn đang được xử lý."
              : "Thank you for choosing Maison de FLOF. Your order is being processed."}
          </p>
        </div>

        {/* Order detail card */}
        <div className="bg-white dark:bg-zinc-950 border border-border p-6 rounded-xl w-full text-left flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-sm font-bold text-muted-foreground">{t.orderNumber}</span>
            <span className="text-sm font-bold font-mono text-jotun-teal">{orderNumber}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-semibold text-muted-foreground">{language === "vi" ? "Khách hàng" : "Customer"}</span>
            <span className="font-bold">{fullName}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-semibold text-muted-foreground">{language === "vi" ? "Số điện thoại" : "Phone"}</span>
            <span className="font-bold">{phone}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-semibold text-muted-foreground">{language === "vi" ? "Phương thức" : "Method"}</span>
            <span className="font-bold">
              {paymentMethod === "COD" ? t.paymentCod : t.paymentTransfer}
            </span>
          </div>

          <div className="flex justify-between text-sm border-t border-border pt-3">
            <span className="font-bold font-serif">{language === "vi" ? "Tổng thanh toán" : "Total paid"}</span>
            <span className="font-bold font-mono text-jotun-teal text-lg">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Bank transfer instructions if transfer selected */}
        {paymentMethod === "TRANSFER" && (
          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-2xl w-full text-left flex flex-col md:flex-row gap-6 items-center">
            
            {/* Left side: QR Code Image */}
            <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl border border-black/5 shadow-xs shrink-0 w-full md:w-fit">
              <img 
                src="/payment_qr.png"
                alt="VietQR Payment Code"
                className="w-48 h-48 object-contain"
              />
              <span className="text-[10px] text-warm-500 font-bold tracking-wider uppercase">{language === "vi" ? "Quét mã QR thanh toán" : "Scan QR code to pay"}</span>
            </div>

            {/* Right side: Bank Transfer details */}
            <div className="flex-1 w-full flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                <Info className="h-5 w-5 shrink-0" />
                <span>{language === "vi" ? "Thông tin chuyển khoản" : "Bank Transfer Instructions"}</span>
              </div>

              <div className="text-xs flex flex-col gap-2.5">
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">NGÂN HÀNG (BANK)</span>
                    <span className="font-bold">VIETCOMBANK (VCB)</span>
                  </div>
                  <button
                    onClick={() => handleCopy("VIETCOMBANK")}
                    className="text-jotun-teal hover:bg-zinc-100 p-1.5 rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">SỐ TÀI KHOẢN (ACCOUNT NO.)</span>
                    <span className="font-bold font-mono">1028372615</span>
                  </div>
                  <button
                    onClick={() => handleCopy("1028372615")}
                    className="text-jotun-teal hover:bg-zinc-100 p-1.5 rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">TÊN TÀI KHOẢN (ACCOUNT NAME)</span>
                    <span className="font-bold">CONG TY TNHH MAISON DE FLOF</span>
                  </div>
                  <button
                    onClick={() => handleCopy("CONG TY TNHH MAISON DE FLOF")}
                    className="text-jotun-teal hover:bg-zinc-100 p-1.5 rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">NỘI DUNG CK (TRANSFER MESSAGE)</span>
                    <span className="font-bold font-mono text-jotun-teal">{orderNumber}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(orderNumber)}
                    className="text-jotun-teal hover:bg-zinc-100 p-1.5 rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed mt-1">
                ⚠️ {language === "vi"
                  ? "Vui lòng nhập đúng mã đơn hàng trong nội dung chuyển khoản. Đơn hàng sẽ được tự động kích hoạt sau khi hệ thống nhận được tiền."
                  : "Please enter the exact order number in the bank description. Your order will be activated automatically."}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="bg-jotun-teal text-white font-bold px-8 py-3.5 rounded-md hover:bg-jotun-darkTeal transition-colors shadow-md"
        >
          {language === "vi" ? "Về Trang Chủ" : "Go to Homepage"}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-jotun-teal"
        >
          <ChevronLeft className="h-4 w-4" />
          {language === "vi" ? "Quay lại giỏ hàng" : "Back to cart"}
        </button>
        <span className="text-xs text-muted-foreground font-semibold">
          {items.length} {language === "vi" ? "sản phẩm" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping Form Panel */}
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
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === "vi" ? "Nguyễn Văn A..." : "John Doe..."}
                    className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {t.phone} <span className="text-red-500">*</span>
                  </label>
                  <input
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
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com..."
                  className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Tỉnh / Thành phố" : "Province / City"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder={language === "vi" ? "Hà Nội, TP.HCM..." : "Hanoi..."}
                    className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Quận / Huyện" : "District"} <span className="text-red-500">*</span>
                  </label>
                  <input
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
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  {language === "vi" ? "Địa chỉ nhận hàng (Số nhà, đường...)" : "Address"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === "vi" ? "Số 12, Ngõ 34, Phố Huế..." : "123 Street..."}
                  className="px-3.5 py-2.5 rounded-md border border-border bg-background text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  {language === "vi" ? "Ghi chú đơn hàng" : "Order Notes"}
                </label>
                <textarea
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
                  {t.paymentMethod}
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
                    <span className="text-sm font-bold text-foreground">{t.paymentCod}</span>
                    <span className="text-[10px] text-muted-foreground leading-normal">
                      Thanh toán tiền mặt khi nhân viên bưu điện giao hàng trực tiếp.
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
                    <span className="text-sm font-bold text-foreground">{t.paymentTransfer}</span>
                    <span className="text-[10px] text-muted-foreground leading-normal">
                      Nhận thông tin tài khoản và quét mã QR ngân hàng thanh toán tự động.
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Checkout button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-jotun-teal text-white font-bold py-4 rounded-md hover:bg-jotun-darkTeal disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2 text-sm mt-4"
              >
                {isSubmitting
                  ? language === "vi"
                    ? "Đang đặt hàng..."
                    : "Placing Order..."
                  : t.placeOrder}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Order Items Review Sidebar */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border border-border p-6 rounded-xl shadow-sm flex flex-col gap-6">
          <h2 className="font-serif font-bold text-lg border-b border-border pb-3">
            {language === "vi" ? "Đơn hàng của bạn" : "Your Order"}
          </h2>

          {/* List of items inside sidebar */}
          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center justify-between text-xs py-1 border-b border-zinc-50 dark:border-zinc-900 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 border border-border bg-zinc-50 rounded overflow-hidden shrink-0">
                    <img src={item.paint.images?.[0] || "/product_interior.png"} alt={item.paint.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold line-clamp-1">
                      {language === "vi" ? item.paint.name : item.paint.nameEn}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {item.paint.volume} {item.paint.volumeUnit}
                      {item.selectedColor ? ` | ${item.selectedColor.code} - ${language === "vi" ? item.selectedColor.name : item.selectedColor.nameEn}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0">
                  <span className="text-muted-foreground">x{item.quantity}</span>
                  <span className="font-bold block text-jotun-teal">
                    {formatPrice(
                      (item.paint.discountPercent && item.paint.discountPercent > 0
                        ? item.paint.price * (1 - item.paint.discountPercent / 100)
                        : item.paint.price) * item.quantity
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing calculations */}
          <div className="border-t border-border pt-4 flex flex-col gap-3 font-semibold text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t.cartItemTotal}</span>
              <span className="font-mono text-foreground">{formatPrice(subtotal)}</span>
            </div>
            {discountParam > 0 && (
              <div className="flex justify-between text-red-500">
                <span>{language === "vi" ? "Giảm giá" : "Discount"}</span>
                <span className="font-mono">-{formatPrice(discountParam)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t.cartShipping}</span>
              <span className="font-mono text-foreground">
                {shippingFee === 0
                  ? language === "vi"
                    ? "Miễn phí"
                    : "Free"
                  : formatPrice(shippingFee)}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex justify-between items-end">
            <span className="font-serif font-bold text-sm">{language === "vi" ? "Tổng cộng" : "Grand Total"}</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-jotun-teal font-mono block">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component wrapped in Suspense to follow Next.js strict routing rules
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-6 py-24 text-center">
        <div className="animate-pulse text-muted-foreground font-serif text-lg">Loading checkout...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
