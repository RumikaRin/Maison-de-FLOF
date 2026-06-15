import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission } from "@/lib/api-auth";

const promotionSchema = z.object({
  discountPercent: z.number().int().min(0).max(100),
  categoryId: z.string().optional(),
  paintId: z.string().optional(),
}).refine((value) => value.categoryId || value.paintId, {
  message: "Cần chọn danh mục hoặc sản phẩm",
});

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("PROMOTION_MANAGE");
    const parsed = promotionSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin khuyến mãi không hợp lệ");
    await db.paint.updateMany({
      where: {
        isActive: true,
        ...(parsed.data.paintId
          ? { id: parsed.data.paintId }
          : { categoryId: parsed.data.categoryId }),
      },
      data: { discountPercent: parsed.data.discountPercent },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
