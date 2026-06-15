import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { couponValidationSchema } from "@/lib/order-validation";
import { calculateCouponDiscount, isCouponUsable } from "@/lib/commerce";

export async function POST(request: NextRequest) {
  const parsed = couponValidationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu mã giảm giá không hợp lệ" }, { status: 400 });
  }

  const { subtotal } = parsed.data;
  const code = parsed.data.code.toUpperCase();
  const coupon = await db.coupon.findUnique({ where: { code } });
  const now = new Date();

  if (!isCouponUsable(coupon, subtotal, now)) {
    return NextResponse.json(
      { error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" },
      { status: 400 },
    );
  }

  const discount = calculateCouponDiscount(coupon, subtotal);

  return NextResponse.json({ code, discount });
}
