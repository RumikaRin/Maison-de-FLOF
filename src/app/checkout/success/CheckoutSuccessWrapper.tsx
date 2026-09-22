/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useLanguageStore } from "@/store/language-store";
import { CheckoutSuccess } from "@/components/features/checkout/CheckoutSuccess";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/csp-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CheckoutSuccessWrapperProps {
  orderNumber: string;
  fullName: string;
  phone: string;
  paymentMethod: string;
  confirmedTotal: number;
  vnpayStatus?: string;
}

export function CheckoutSuccessWrapper({
  orderNumber,
  fullName,
  phone,
  paymentMethod,
  confirmedTotal,
  vnpayStatus,
}: CheckoutSuccessWrapperProps) {
  const { language } = useLanguageStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSwitchedToCod, setIsSwitchedToCod] = useState(false);

  useEffect(() => {
    if (vnpayStatus === "failed" || vnpayStatus === "error") {
      toast.error(
        language === "vi"
          ? "Thanh toán VNPay chưa hoàn tất hoặc bị hủy!"
          : "Payment failed or cancelled!",
      );
    }
  }, [vnpayStatus, language]);

  const handleRetryVNPay = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY_VNPAY" }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(
          data.error?.message ||
            (language === "vi"
              ? "Không thể tạo lại liên kết thanh toán"
              : "Could not create payment link"),
        );
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối" : "Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchToCod = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWITCH_TO_COD" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          language === "vi"
            ? "Đã chuyển phương thức sang nhận hàng thanh toán (COD)!"
            : "Switched to Cash on Delivery (COD)!",
        );
        setIsSwitchedToCod(true);
      } else {
        toast.error(
          data.error?.message ||
            (language === "vi"
              ? "Không thể chuyển sang COD"
              : "Could not switch to COD"),
        );
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối" : "Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      language === "vi"
        ? "Bạn có chắc chắn muốn hủy đơn hàng này và giải phóng sản phẩm trong kho?"
        : "Are you sure you want to cancel this order and release stock?",
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          reason: "Khách hàng hủy đơn sau khi thanh toán thất bại",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          language === "vi"
            ? "Đơn hàng đã được hủy thành công."
            : "Order cancelled successfully.",
        );
        router.push("/products");
      } else {
        toast.error(
          data.error?.message ||
            (language === "vi" ? "Không thể hủy đơn" : "Could not cancel order"),
        );
      }
    } catch {
      toast.error(language === "vi" ? "Lỗi kết nối" : "Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  if ((vnpayStatus === "failed" || vnpayStatus === "error") && !isSwitchedToCod) {
    return (
      <div className="mx-auto w-full max-w-2xl px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl text-left text-atelier-ink">
        <p className="fl-label text-atelier-danger">
          ✕ {language === "vi" ? "Giao dịch chưa hoàn tất" : "Transaction incomplete"}
        </p>
        <h1 className="fl-display mt-fl-2xs text-fl-2xl">
          {language === "vi" ? "Thanh toán chưa thành công." : "Payment incomplete."}
        </h1>
        <p className="fl-measure-tight mt-fl-2xs text-fl-sm text-atelier-ink-2">
          {language === "vi"
            ? `Đơn hàng ${orderNumber} của bạn đã được ghi nhận nhưng chưa thanh toán. Sản phẩm đang được giữ trong kho cho bạn.`
            : `Your order ${orderNumber} has been recorded but not paid. Items are held in stock for you.`}
        </p>

        <div className="mt-fl-md flex flex-wrap gap-3">
          <Button
            onClick={handleRetryVNPay}
            disabled={isProcessing}
            className="bg-atelier-accent text-white"
          >
            {isProcessing
              ? (language === "vi" ? "Đang xử lý..." : "Processing...")
              : (language === "vi" ? "Thanh toán lại bằng VNPay" : "Retry with VNPay")}
          </Button>

          <Button
            onClick={handleSwitchToCod}
            disabled={isProcessing}
            variant="outline"
          >
            {language === "vi" ? "Chuyển sang trả khi nhận (COD)" : "Switch to COD"}
          </Button>

          <Button
            onClick={handleCancelOrder}
            disabled={isProcessing}
            variant="ghost"
            className="text-atelier-danger hover:bg-atelier-danger/10"
          >
            {language === "vi" ? "Hủy đơn hàng này" : "Cancel order"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutSuccess
      language={language}
      orderNumber={orderNumber}
      fullName={fullName}
      phone={phone}
      paymentMethod={isSwitchedToCod ? "COD" : paymentMethod}
      confirmedTotal={confirmedTotal}
      total={confirmedTotal}
    />
  );
}
