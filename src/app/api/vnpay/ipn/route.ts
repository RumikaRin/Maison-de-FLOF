import { after, NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentService } from "@/services/vnpay.service";
import { markPaymentPaidAndConfirmOrder } from "@/services/order-lifecycle.service";
import { processEmailOutboxRecord } from "@/lib/process-email-outbox";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { writeOperationalLog } from "@/lib/operations/log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  try {
    const result = paymentService.verifyIpn(query);

    // Signature first: a callback whose HMAC does not verify is rejected before
    // anything is read from it, regardless of its claimed response code.
    if (!result.isVerified) {
      writeOperationalLog("warn", "vnpay.ipn.invalid_signature", {
        orderId: query.vnp_TxnRef,
      });
      return NextResponse.json({ RspCode: "97", Message: "Invalid signature" }, { status: 200 });
    }

    // Signature valid but the gateway reported a failed/cancelled transaction —
    // acknowledge without marking the order paid.
    if (!result.isSuccess) {
      return NextResponse.json({ RspCode: "00", Message: "Confirmed" }, { status: 200 });
    }

    if (!result.orderId) {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
    }

    const paid = await markPaymentPaidAndConfirmOrder({
      orderId: result.orderId,
      amount: result.amount,
      transactionCode: result.transactionNo,
      confirmedBy: "system:vnpay-ipn",
      // VNPay: confirmation email only after successful payment
      enqueueConfirmationEmail: true,
    });

    if (!paid.ok) {
      if (paid.code === "ORDER_NOT_FOUND" || paid.code === "PAYMENT_NOT_FOUND") {
        return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
      }
      if (paid.code === "INVALID_AMOUNT") {
        return NextResponse.json({ RspCode: "04", Message: "Invalid amount" }, { status: 200 });
      }
      if (paid.code === "ORDER_CANCELLED") {
        return NextResponse.json({ RspCode: "02", Message: "Order cancelled" }, { status: 200 });
      }
      return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" }, { status: 200 });
    }

    if (paid.alreadyPaid) {
      return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" }, { status: 200 });
    }

    after(async () => {
      try {
        const order = await db.order.findUnique({
          where: { id: result.orderId },
          select: { orderNumber: true },
        });
        if (!order) return;
        const pending = await db.emailOutbox.findFirst({
          where: {
            type: "ORDER_CONFIRMATION",
            status: "PENDING",
            payload: {
              path: ["orderNumber"],
              equals: order.orderNumber,
            },
          },
        });
        if (pending) {
          await processEmailOutboxRecord(db, pending, sendOrderConfirmationEmail);
        }
      } catch (error) {
        console.error("Failed to process background email outbox for order:", result.orderId, error);
      }
    });

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" }, { status: 200 });
  } catch (error) {
    writeOperationalLog("error", "vnpay.ipn.unexpected_error", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" }, { status: 200 });
  }
}
