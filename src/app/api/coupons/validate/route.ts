import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { couponValidationSchema } from "@/lib/order-validation";
import { calculateCouponDiscount, isCouponUsable } from "@/lib/commerce";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const parsed = couponValidationSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Dữ liệu mã giảm giá không hợp lệ");
    }

    const { subtotal } = parsed.data;
    const code = parsed.data.code.toUpperCase();
    const coupon = await db.coupon.findUnique({ where: { code } });
    const now = new Date();

    if (!isCouponUsable(coupon, subtotal, now)) {
      throw new ApiError(400, "Mã giảm giá không hợp lệ hoặc đã hết hạn");
    }

    const discount = calculateCouponDiscount(coupon, subtotal);

    return NextResponse.json({ code, discount });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
