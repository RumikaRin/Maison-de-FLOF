/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import { Copy } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/csp-toast";
import { Rule, SpecLedger, TypographicLink } from "@/components/ui/editorial";

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
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      language === "vi" ? "Đã sao chép vào bộ nhớ tạm." : "Copied to clipboard."
    );
  };

  const bankRows = [
    { label: language === "vi" ? "Ngân hàng" : "Bank", value: "VIETCOMBANK (VCB)", copy: "VIETCOMBANK" },
    { label: language === "vi" ? "Số tài khoản" : "Account no.", value: "1028372615", copy: "1028372615" },
    { label: language === "vi" ? "Tên tài khoản" : "Account name", value: "CONG TY TNHH MAISON DE FLOF", copy: "CONG TY TNHH MAISON DE FLOF" },
    { label: language === "vi" ? "Nội dung CK" : "Transfer message", value: orderNumber, copy: orderNumber },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl text-left text-atelier-ink">
      {/* The receipt is framed like a printed order slip: one hairline frame,
          a strong top rule as its letterhead. Not a card — the inside stays
          hairline rows, so the card-in-card ban is respected. */}
      <div className="rounded-surface border border-atelier-rule border-t-2 border-t-atelier-ink bg-atelier-paper p-[clamp(1.25rem,4vw,2.5rem)]">
      {/* One serif line — success is stated, not celebrated. */}
      <p className="fl-label text-atelier-success">
        ✓ {language === "vi" ? "Đã tiếp nhận đơn hàng" : "Order received"}
      </p>
      <h1 className="fl-display mt-fl-2xs text-fl-2xl">
        {language === "vi" ? "Đặt hàng thành công." : "Your order is placed."}
      </h1>
      <p className="fl-measure-tight mt-fl-2xs text-fl-sm text-atelier-ink-2">
        {language === "vi"
          ? "Cảm ơn bạn đã lựa chọn Maison de FLOF. Đơn hàng của bạn đang được xử lý."
          : "Thank you for choosing Maison de FLOF. Your order is being processed."}
      </p>

      {/* Order details as a ledger */}
      <SpecLedger
        className="mt-fl-lg"
        columns={2}
        rows={[
          {
            label: language === "vi" ? "Mã đơn hàng" : "Order number",
            value: <span className="tabular-nums">{orderNumber}</span>,
          },
          {
            label: language === "vi" ? "Khách hàng" : "Customer",
            value: fullName,
          },
          {
            label: language === "vi" ? "Số điện thoại" : "Phone",
            value: <span className="tabular-nums">{phone}</span>,
          },
          {
            label: language === "vi" ? "Phương thức" : "Method",
            value:
              paymentMethod === "COD"
                ? (language === "vi" ? "Thanh toán khi nhận hàng (COD)" : "Cash on Delivery")
                : (language === "vi" ? "Chuyển khoản ngân hàng" : "Bank Transfer"),
          },
          {
            label: language === "vi" ? "Tổng thanh toán" : "Total paid",
            value: (
              <span className="text-fl-lg font-medium tabular-nums">
                {formatPrice(confirmedTotal ?? total)}
              </span>
            ),
          },
        ]}
      />

      {/* Bank transfer instructions if transfer selected */}
      {paymentMethod === "TRANSFER" && (
        <section className="mt-fl-xl">
          <h2 className="fl-display text-fl-xl">
            {language === "vi" ? "Thông tin chuyển khoản" : "Bank transfer instructions"}
          </h2>
          <Rule className="mt-fl-xs" />

          <div className="mt-fl-md flex flex-col items-start gap-fl-md md:flex-row">
            {/* QR Code */}
            <figure className="shrink-0">
              <Image
                src="/payment_qr.png"
                alt="VietQR Payment Code"
                width={192}
                height={192}
                className="h-48 w-48 rounded-surface border border-atelier-rule bg-atelier-paper object-contain"
              />
              <figcaption className="fl-label mt-fl-2xs">
                {language === "vi" ? "Quét mã QR thanh toán" : "Scan QR code to pay"}
              </figcaption>
            </figure>

            {/* Transfer details as hairline rows */}
            <dl className="w-full min-w-0 flex-1 border-t border-atelier-rule">
              {bankRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-fl-sm border-b border-atelier-rule py-fl-2xs"
                >
                  <div className="min-w-0">
                    <dt className="fl-label">{row.label}</dt>
                    <dd className="break-all text-fl-sm font-medium tabular-nums">{row.value}</dd>
                  </div>
                  <button
                    onClick={() => handleCopy(row.copy)}
                    aria-label={`${language === "vi" ? "Sao chép" : "Copy"} ${row.label}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-atelier-accent transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2 md:h-9 md:w-9"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </dl>
          </div>

          <p className="fl-measure mt-fl-sm text-fl-xs leading-relaxed text-atelier-ink-2">
            {language === "vi"
              ? "Vui lòng nhập đúng mã đơn hàng trong nội dung chuyển khoản. Nhân viên sẽ đối soát và xác nhận thanh toán trước khi xử lý đơn."
              : "Please enter the exact order number in the bank description. Staff will reconcile and confirm the payment before processing."}
          </p>
        </section>
      )}

      </div>

      {/* Onward, typographically — outside the frame, like actions under a slip. */}
      <div className="mt-fl-md flex flex-wrap gap-x-fl-lg gap-y-fl-2xs">
        <TypographicLink href="/profile" arrow="→">
          {language === "vi" ? "Theo dõi đơn hàng" : "Track your order"}
        </TypographicLink>
        <TypographicLink href="/" arrow="→">
          {language === "vi" ? "Về trang chủ" : "Go to homepage"}
        </TypographicLink>
      </div>
    </div>
  );
}
