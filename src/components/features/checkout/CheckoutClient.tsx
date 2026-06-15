"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { CheckoutSuccess } from "./CheckoutSuccess";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageStore();
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
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "TRANSFER" | "VNPAY">("COD");

  // Order status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const idempotencyKeyRef = useRef("");

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState("");

  const { data: authSession, status: authStatus } = useSession();

  useEffect(() => {
    setMounted(true);
    const disc = searchParams.get("discount");
    if (disc) {
      setDiscountParam(Number(disc));
    }
    if (authSession?.user?.email) {
      setEmail(authSession.user.email);
      setFullName((current) => current || authSession.user?.name || "");
    }

    if (authSession?.user?.email) {
      fetch("/api/profile/addresses")
        .then((response) => response.json())
        .then((saved) => {
          if (!Array.isArray(saved)) return;
          setSavedAddresses(saved);
          const defaultAddr = saved.find((item: any) => item.isDefault);
          if (defaultAddr) {
            setSelectedAddrId(defaultAddr.id);
            setFullName(defaultAddr.name);
            setPhone(defaultAddr.phone);
            setProvince(defaultAddr.province);
            setDistrict(defaultAddr.district);
            setAddress(defaultAddr.address);
          }
        })
        .catch(() => setSavedAddresses([]));
    }
  }, [searchParams, authSession]);

  if (!mounted) return null;

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50000;
  const total = Math.max(0, subtotal + shippingFee - discountParam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authStatus !== "authenticated" || !authSession?.user?.email) {
      toast.error(
        language === "vi"
          ? "Vui lòng đăng nhập trước khi đặt hàng."
          : "Please sign in before placing an order.",
      );
      router.push("/login");
      return;
    }

    if (items.length === 0) {
      toast.error(language === "vi" ? "Giỏ hàng đang trống." : "Your cart is empty.");
      return;
    }

    if (!fullName || !phone || !address || !province || !district) {
      toast.error(
        language === "vi"
          ? "Vui lòng nhập đầy đủ thông tin giao hàng bắt buộc."
          : "Please fill in all required shipping fields."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            paintId: item.paint.id,
            colorId: item.selectedColor?.id || null,
            quantity: item.quantity,
          })),
          couponCode: searchParams.get("coupon") || undefined,
          paymentMethod,
          note: notes,
          shipping: {
            fullName,
            phone,
            addressLine1: address,
            district,
            province,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo đơn hàng");
      }

      clearCart();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      setOrderNumber(data.order.id);
      setConfirmedTotal(data.order.total);
      setIsSuccess(true);
      toast.success(
        language === "vi" ? "Đặt hàng thành công!" : "Order placed successfully!"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Không thể tạo đơn hàng."
            : "Could not place order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <CheckoutSuccess
        language={language}
        orderNumber={orderNumber}
        fullName={fullName}
        phone={phone}
        paymentMethod={paymentMethod}
        confirmedTotal={confirmedTotal}
        total={total}
      />
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
        <CheckoutForm
          language={language}
          savedAddresses={savedAddresses}
          selectedAddrId={selectedAddrId}
          setSelectedAddrId={setSelectedAddrId}
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          province={province}
          setProvince={setProvince}
          district={district}
          setDistrict={setDistrict}
          address={address}
          setAddress={setAddress}
          notes={notes}
          setNotes={setNotes}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <CheckoutOrderSummary
          language={language}
          items={items}
          subtotal={subtotal}
          discountParam={discountParam}
          shippingFee={shippingFee}
          total={total}
        />
      </div>
    </div>
  );
}
