import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutSuccessWrapper } from "./CheckoutSuccessWrapper";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; vnpay_status?: string }>;
}) {
  const { orderId, vnpay_status } = await searchParams;
  
  if (!orderId) {
    redirect("/checkout");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { customer: { include: { user: true } }, payment: true },
  });

  if (!order) {
    redirect("/checkout");
  }

  return (
    <CheckoutSuccessWrapper 
      orderNumber={order.orderNumber}
      fullName={order.shippingName || order.customer.user.name || "Khách hàng"}
      phone={order.shippingPhone || order.customer.user.phone || ""}
      paymentMethod={order.paymentMethod}
      confirmedTotal={Number(order.total)}
      vnpayStatus={vnpay_status}
    />
  );
}
