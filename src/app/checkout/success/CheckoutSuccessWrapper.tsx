/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useLanguageStore } from "@/store/language-store";
import { CheckoutSuccess } from "@/components/features/checkout/CheckoutSuccess";
import { useEffect } from "react";
import { toast } from "@/components/ui/csp-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      <div className="mx-auto w-full max-w-2xl px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl text-left text-atelier-ink">
        <p className="fl-label text-atelier-danger">
          ✕ {language === "vi" ? "Giao dịch chưa hoàn tất" : "Transaction incomplete"}
        </p>
        <h1 className="fl-display mt-fl-2xs text-fl-2xl">
          {language === "vi" ? "Thanh toán thất bại." : "Payment failed."}
        </h1>
        <p className="fl-measure-tight mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {language === "vi"
            ? "Giao dịch thanh toán VNPay của bạn đã bị hủy hoặc xảy ra lỗi. Đơn hàng của bạn chưa được thanh toán."
            : "Your VNPay transaction was cancelled or failed. Your order has not been paid."}
        </p>
        <Button
          onClick={() => router.push("/profile?tab=orders")}
          className="mt-fl-md"
        >
          {language === "vi" ? "Xem đơn hàng & Thanh toán lại" : "View Orders & Pay again"}
        </Button>
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
