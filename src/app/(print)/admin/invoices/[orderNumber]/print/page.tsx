import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

// This is the ONE place pure black-on-white is intentional: it is a printed
// Vietnamese tax document (hóa đơn), so ink-saving white paper + black ink is
// correct and is NOT an atelier design-system violation.

// Seller identity — mirrors the footer copy in src/lib/dictionary.ts
// (footerAddress) and the published contact lines. Kept inline here because
// invoices are Vietnamese tax documents and this file must not import/mutate
// the shared dictionary this turn.
const SELLER = {
  name: "Maison de FLOF",
  legalName: "Maison de FLOF Paint Store",
  address: "Số 15 Cầu Giấy, Láng Thượng, Đống Đa, Hà Nội",
  hotline: "1800 1511 / 0900 000 001",
  email: "contact@flof.vn",
} as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "COD - Thanh toán khi nhận hàng",
  TRANSFER: "Chuyển khoản ngân hàng",
  VNPAY: "VNPay",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: "Đã thanh toán",
  PENDING: "Chờ thanh toán",
  REFUNDED: "Đã hoàn tiền",
  FAILED: "Thất bại",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function formatDateVi(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  // --- Server-side admin/staff guard (defense in depth on top of middleware) ---
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  const account = await db.user.findUnique({
    where: { email: session.user.email },
    include: { role: true },
  });
  const roleType = account?.role.type;
  if (roleType !== "ADMIN" && roleType !== "STAFF") {
    // An invoice exposes customer PII — never render it for non-staff.
    notFound();
  }

  const { orderNumber } = await params;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      customer: { include: { user: true } },
      address: true,
      items: { include: { paint: true } },
      payment: true,
    },
  });
  if (!order) notFound();

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const buyerName =
    order.shippingName || order.address?.fullName || order.customer.user.name || "—";
  const buyerPhone =
    order.shippingPhone || order.address?.phone || order.customer.user.phone || "—";
  const buyerEmail = order.shippingEmail || order.customer.user.email || "—";
  const buyerAddress = order.shippingAddress
    ? [order.shippingAddress, order.shippingDistrict, order.shippingProvince]
        .filter(Boolean)
        .join(", ")
    : order.address
      ? [
          order.address.addressLine1,
          order.address.addressLine2,
          order.address.district,
          order.address.province,
        ]
          .filter(Boolean)
          .join(", ")
      : "—";

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const shippingFee = Number(order.shippingFee);
  const total = Number(order.total);

  const paymentMethod =
    PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
  const paymentStatusRaw = order.payment?.status || "PENDING";
  const paymentStatus = PAYMENT_STATUS_LABELS[paymentStatusRaw] || paymentStatusRaw;
  const orderStatus = ORDER_STATUS_LABELS[order.status] || order.status;

  return (
    <div className="min-h-screen bg-neutral-100 py-8 text-neutral-900 print:min-h-0 print:bg-white print:py-0">
      {/* Print-specific rules Tailwind can't express (page margins + forced
          background/ink). Carries the per-request CSP nonce. */}
      <style nonce={nonce}>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          html, body { background: #fff !important; }
          .invoice-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .invoice-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="invoice-print mx-auto w-full max-w-[820px] px-4 print:px-0">
        <PrintButton />

        <div className="invoice-sheet rounded-lg bg-white p-10 shadow-sm print:rounded-none print:p-0 print:shadow-none">
          {/* Header: seller + invoice meta */}
          <div className="flex flex-col justify-between gap-6 border-b-2 border-neutral-900 pb-6 sm:flex-row">
            <div className="max-w-sm">
              <p className="font-serif text-2xl font-bold tracking-tight text-neutral-900">
                {SELLER.name}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {SELLER.legalName}
              </p>
              <div className="mt-3 space-y-0.5 text-xs leading-relaxed text-neutral-700">
                <p>Địa chỉ: {SELLER.address}</p>
                <p>Hotline: {SELLER.hotline}</p>
                <p>Email: {SELLER.email}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h1 className="font-serif text-2xl font-bold uppercase tracking-tight text-neutral-900">
                Hóa đơn bán hàng
              </h1>
              <p className="mt-2 text-xs text-neutral-600">
                Số hóa đơn:{" "}
                <span className="font-mono font-bold text-neutral-900">
                  {order.orderNumber}
                </span>
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Ngày lập:{" "}
                <span className="font-semibold text-neutral-900">
                  {formatDateVi(order.createdAt)}
                </span>
              </p>
            </div>
          </div>

          {/* Buyer block */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                Người mua hàng
              </p>
              <div className="mt-2 space-y-1 text-xs leading-relaxed text-neutral-800">
                <p className="text-sm font-bold text-neutral-900">{buyerName}</p>
                <p>Điện thoại: {buyerPhone}</p>
                <p>Email: {buyerEmail}</p>
                <p>Địa chỉ: {buyerAddress}</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                Thanh toán &amp; trạng thái
              </p>
              <div className="mt-2 space-y-1 text-xs leading-relaxed text-neutral-800">
                <p>
                  Hình thức:{" "}
                  <span className="font-semibold text-neutral-900">{paymentMethod}</span>
                </p>
                <p>
                  Thanh toán:{" "}
                  <span className="font-semibold text-neutral-900">{paymentStatus}</span>
                </p>
                <p>
                  Đơn hàng:{" "}
                  <span className="font-semibold text-neutral-900">{orderStatus}</span>
                </p>
                {order.payment?.transactionCode ? (
                  <p>
                    Mã giao dịch:{" "}
                    <span className="font-mono text-neutral-900">
                      {order.payment.transactionCode}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Itemised table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="border-y border-neutral-900 text-left uppercase tracking-wide text-neutral-700">
                  <th className="py-2.5 pr-2 text-[11px] font-bold">STT</th>
                  <th className="px-2 py-2.5 text-[11px] font-bold">Sản phẩm</th>
                  <th className="px-2 py-2.5 text-[11px] font-bold">Màu</th>
                  <th className="px-2 py-2.5 text-[11px] font-bold">SKU</th>
                  <th className="px-2 py-2.5 text-right text-[11px] font-bold">SL</th>
                  <th className="px-2 py-2.5 text-right text-[11px] font-bold">Đơn giá</th>
                  <th className="py-2.5 pl-2 text-right text-[11px] font-bold">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const name = item.productName || item.paint.name;
                  const sku = item.productSku || item.paint.sku;
                  const color = [item.colorName, item.colorCode]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <tr key={item.id} className="border-b border-neutral-200 align-top">
                      <td className="py-2.5 pr-2 tabular-nums text-neutral-600">
                        {index + 1}
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-neutral-900">
                        {name}
                      </td>
                      <td className="px-2 py-2.5 text-neutral-700">{color || "—"}</td>
                      <td className="px-2 py-2.5 font-mono text-neutral-700">{sku}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-neutral-800">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-neutral-800">
                        {formatPrice(Number(item.price))}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-semibold tabular-nums text-neutral-900">
                        {formatPrice(Number(item.total))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-neutral-700">
                <span>Cộng tiền hàng</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-neutral-700">
                  <span>Chiết khấu / Giảm giá</span>
                  <span className="tabular-nums">-{formatPrice(discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-neutral-700">
                <span>Phí vận chuyển</span>
                <span className="tabular-nums">
                  {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-sm font-bold text-neutral-900">
                <span>TỔNG CỘNG</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {order.note ? (
            <div className="mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-600">
              <span className="font-semibold text-neutral-800">Ghi chú: </span>
              {order.note}
            </div>
          ) : null}

          {/* Signatures */}
          <div className="mt-14 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-bold uppercase tracking-wide text-neutral-800">
                Người mua hàng
              </p>
              <p className="mt-1 italic text-neutral-500">(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wide text-neutral-800">
                Người bán hàng
              </p>
              <p className="mt-1 italic text-neutral-500">(Ký, đóng dấu)</p>
            </div>
          </div>

          <p className="mt-10 text-center text-[10px] text-neutral-400">
            {SELLER.name} · {SELLER.address} · {SELLER.email}
          </p>
        </div>
      </div>
    </div>
  );
}
