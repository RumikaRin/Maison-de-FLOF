import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/vnpay.service";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  try {
    const result = paymentService.verifyIpn(query);
    
    if (!result.isSuccess) {
      return NextResponse.json({ RspCode: "97", Message: "Invalid signature" }, { status: 200 });
    }

    if (!result.orderId) {
        return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
    }

    const order = await db.order.findUnique({
      where: { id: result.orderId },
      include: { payment: true }
    });

    if (!order) {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
    }

    if (order.payment?.amount && Number(order.payment.amount) !== result.amount) {
      return NextResponse.json({ RspCode: "04", Message: "Invalid amount" }, { status: 200 });
    }

    if (order.payment?.status === "PAID") {
      return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" }, { status: 200 });
    }

    // Update payment
    await db.payment.update({
      where: { orderId: result.orderId },
      data: {
        status: "PAID",
        transactionCode: result.transactionNo,
        paidAt: new Date(),
      }
    });

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" }, { status: 200 });
  } catch (error) {
    console.error("VNPay IPN error:", error);
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" }, { status: 200 });
  }
}
