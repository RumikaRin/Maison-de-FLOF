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
    const result = paymentService.verifyReturn(query);

    // Only a signature-verified, successful callback may transition the order.
    // A forged return URL (valid orderId, vnp_ResponseCode=00, wrong/absent
    // signature) must never mark a payment paid.
    if (result.isVerified && result.isSuccess && result.orderId) {
      // Same verification path as IPN: amount check + idempotent PAID + auto CONFIRMED.
      // IPN remains the primary source of truth; return improves UX when IPN is delayed.
      const paid = await markPaymentPaidAndConfirmOrder({
        orderId: result.orderId,
        amount: result.amount,
        transactionCode: result.transactionNo,
        confirmedBy: "system:vnpay-return",
        enqueueConfirmationEmail: true,
      });

      if (paid.ok && !paid.alreadyPaid) {
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
      }
    }

    const redirectUrl = new URL("/checkout/success", request.url);
    if (result.orderId) {
      redirectUrl.searchParams.set("orderId", result.orderId);
    }
    redirectUrl.searchParams.set(
      "vnpay_status",
      result.isVerified && result.isSuccess ? "success" : "failed",
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    writeOperationalLog("error", "vnpay.return.unexpected_error", {
      name: error instanceof Error ? error.name : typeof error,
    });
    const redirectUrl = new URL("/checkout/success", request.url);
    redirectUrl.searchParams.set("vnpay_status", "error");
    return NextResponse.redirect(redirectUrl);
  }
}
