import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/vnpay.service";
import { markPaymentPaidAndConfirmOrder } from "@/services/order-lifecycle.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  try {
    const result = paymentService.verifyReturn(query);

    if (result.isSuccess && result.orderId) {
      // Same verification path as IPN: amount check + idempotent PAID + auto CONFIRMED.
      // IPN remains the primary source of truth; return improves UX when IPN is delayed.
      await markPaymentPaidAndConfirmOrder({
        orderId: result.orderId,
        amount: result.amount,
        transactionCode: result.transactionNo,
        confirmedBy: "system:vnpay-return",
        enqueueConfirmationEmail: true,
      });
    }

    const redirectUrl = new URL("/checkout/success", request.url);
    if (result.orderId) {
      redirectUrl.searchParams.set("orderId", result.orderId);
    }
    redirectUrl.searchParams.set("vnpay_status", result.isSuccess ? "success" : "failed");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("VNPay return error:", error);
    const redirectUrl = new URL("/checkout/success", request.url);
    redirectUrl.searchParams.set("vnpay_status", "error");
    return NextResponse.redirect(redirectUrl);
  }
}
