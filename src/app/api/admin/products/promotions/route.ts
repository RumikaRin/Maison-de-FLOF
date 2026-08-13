import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const promotionSchema = z.object({
  discountPercent: z.number().int().min(0).max(100),
  categoryId: z.string().optional(),
  paintId: z.string().optional(),
}).refine((value) => value.categoryId || value.paintId, {
  message: "Cần chọn danh mục hoặc sản phẩm",
});

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission("PROMOTION_MANAGE");
    const parsed = promotionSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin khuyến mãi không hợp lệ");
    const updated = await db.paint.updateMany({
      where: {
        isActive: true,
        ...(parsed.data.paintId
          ? { id: parsed.data.paintId }
          : { categoryId: parsed.data.categoryId }),
      },
      data: { discountPercent: parsed.data.discountPercent },
    });
    await createAuditLog(db, {
      actor,
      action: "PRODUCT_PROMOTION_UPDATED",
      entityType: "Paint",
      entityId: parsed.data.paintId || parsed.data.categoryId,
      afterData: {
        discountPercent: parsed.data.discountPercent,
        affectedCount: updated.count,
        scope: parsed.data.paintId ? "PAINT" : "CATEGORY",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
