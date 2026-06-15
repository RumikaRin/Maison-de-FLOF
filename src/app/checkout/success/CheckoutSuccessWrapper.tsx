"use client";

import { useLanguageStore } from "@/store/language-store";
import { CheckoutSuccess } from "@/components/features/checkout/CheckoutSuccess";
import { useEffect } from "react";
import { toast } from "sonner";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function CheckoutSuccessWrapper({
  orderNumber, fullName, phone, paymentMethod, confirmedTotal, vnpayStatus
}: any) {
  const { language } = useLanguageStore();
  const router = useRouter();

  useEffect(() => {
    if (vnpayStatus === "failed" || vnpayStatus === "error") {
      toast.error(language === "vi" ? "Thanh toán thất bại hoặc bị hủy!" : "Payment failed or cancelled!");
    }
  }, [vnpayStatus, language]);

  if (vnpayStatus === "failed" || vnpayStatus === "error") {
    return (
      <div className="container mx-auto px-6 py-16 max-w-2xl text-center flex flex-col items-center gap-8 animate-fade-in">
        <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 shadow-lg">
          <XCircle className="h-12 w-12" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">
            {language === "vi" ? "Thanh toán thất bại!" : "Payment Failed!"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {language === "vi"
              ? "Giao dịch thanh toán VNPay của bạn đã bị hủy hoặc xảy ra lỗi. Đơn hàng của bạn chưa được thanh toán."
              : "Your VNPay transaction was cancelled or failed. Your order has not been paid."}
          </p>
        </div>
        <button
          onClick={() => router.push("/profile?tab=orders")}
          className="bg-warm-900 text-white font-bold px-8 py-3.5 rounded-md hover:bg-warm-800 transition-colors shadow-md"
        >
          {language === "vi" ? "Xem đơn hàng & Thanh toán lại" : "View Orders & Pay again"}
        </button>
      </div>
    );
  }

  return (
    <CheckoutSuccess 
      language={language}
      orderNumber={orderNumber}
      fullName={fullName}
      phone={phone}
      paymentMethod={paymentMethod}
      confirmedTotal={confirmedTotal}
      total={confirmedTotal}
    />
  );
}
