import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/vnpay.service";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  try {
    const result = paymentService.verifyReturn(query);
    
    if (result.isSuccess && result.orderId) {
      // Attempt to update payment if it hasn't been updated by IPN yet.
      // The IPN is more reliable, but doing it here provides immediate feedback.
      await db.payment.updateMany({
        where: { orderId: result.orderId, status: "PENDING" },
        data: { 
            status: "PAID", 
            transactionCode: result.transactionNo, 
            paidAt: new Date() 
        }
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
