"use client";

import Image from "next/image";
import { CheckCircle, Info, Copy } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CheckoutSuccessProps {
  language: string;
  orderNumber: string;
  fullName: string;
  phone: string;
  paymentMethod: string;
  confirmedTotal: number | null;
  total: number;
}

export function CheckoutSuccess({
  language,
  orderNumber,
  fullName,
  phone,
  paymentMethod,
  confirmedTotal,
  total,
}: CheckoutSuccessProps) {
  const router = useRouter();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      language === "vi" ? "Đã sao chép vào bộ nhớ tạm." : "Copied to clipboard."
    );
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl text-center flex flex-col items-center gap-8 animate-fade-in">
      <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg">
        <CheckCircle className="h-12 w-12" />
      </div>

      <div>
        <h1 className="text-3xl font-bold font-serif mb-2">
          {language === "vi" ? "Đặt hàng thành công!" : "Order Successful!"}
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {language === "vi"
            ? "Cảm ơn bạn đã lựa chọn Maison de FLOF. Đơn hàng của bạn đang được xử lý."
            : "Thank you for choosing Maison de FLOF. Your order is being processed."}
        </p>
      </div>

      {/* Order detail card */}
      <div className="bg-white dark:bg-zinc-950 border border-border p-6 rounded-xl w-full text-left flex flex-col gap-4 shadow-sm">
        <div className="flex justify-between border-b border-border pb-3">
          <span className="text-sm font-bold text-muted-foreground">
            {language === "vi" ? "Mã đơn hàng" : "Order Number"}
          </span>
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
            {paymentMethod === "COD"
              ? (language === "vi" ? "Thanh toán khi nhận hàng (COD)" : "Cash on Delivery")
              : (language === "vi" ? "Chuyển khoản ngân hàng" : "Bank Transfer")}
          </span>
        </div>

        <div className="flex justify-between text-sm border-t border-border pt-3">
          <span className="font-bold font-serif">{language === "vi" ? "Tổng thanh toán" : "Total paid"}</span>
          <span className="font-bold font-mono text-jotun-teal text-lg">{formatPrice(confirmedTotal ?? total)}</span>
        </div>
      </div>

      {/* Bank transfer instructions if transfer selected */}
      {paymentMethod === "TRANSFER" && (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-2xl w-full text-left flex flex-col md:flex-row gap-6 items-center">
          
          {/* Left side: QR Code Image */}
          <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl border border-black/5 shadow-xs shrink-0 w-full md:w-fit">
            <Image
              src="/payment_qr.png"
              alt="VietQR Payment Code"
              width={192}
              height={192}
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
                ? "Vui lòng nhập đúng mã đơn hàng trong nội dung chuyển khoản. Nhân viên sẽ đối soát và xác nhận thanh toán trước khi xử lý đơn."
                : "Please enter the exact order number in the bank description. Staff will reconcile and confirm the payment before processing."}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/")}
        className="bg-warm-900 text-white font-bold px-8 py-3.5 rounded-md hover:bg-warm-800 transition-colors shadow-md"
      >
        {language === "vi" ? "Về Trang Chủ" : "Go to Homepage"}
      </button>
    </div>
  );
}
