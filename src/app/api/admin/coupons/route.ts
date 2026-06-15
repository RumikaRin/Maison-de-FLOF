import { CouponType } from "@prisma/client";
import { z } from "zod";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(50),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  minSpend: z.number().nonnegative().default(0),
  maxSpend: z.number().positive().nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

function validateCoupon(data: z.infer<typeof couponSchema>) {
  if (data.endDate <= data.startDate) throw new ApiError(400, "Ngày kết thúc phải sau ngày bắt đầu");
  if (data.type === "PERCENTAGE" && data.value > 100) {
    throw new ApiError(400, "Coupon phần trăm không được vượt quá 100%");
  }
}

function serializeCoupon(coupon: {
  value: { toString(): string };
  minSpend: { toString(): string };
  maxSpend: { toString(): string } | null;
  [key: string]: unknown;
}) {
  return {
    ...coupon,
    value: Number(coupon.value),
    minSpend: Number(coupon.minSpend),
    maxSpend: coupon.maxSpend ? Number(coupon.maxSpend) : null,
  };
}

async function ensureUniqueCode(code: string, id?: string) {
  const existing = await db.coupon.findFirst({
    where: { code, id: id ? { not: id } : undefined },
  });
  if (existing) throw new ApiError(409, "Mã giảm giá đã tồn tại");
}

export async function GET() {
  try {
    await requireStaff();
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(coupons.map(serializeCoupon));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("COUPON_MANAGE");
    const parsed = couponSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin mã giảm giá không hợp lệ");
    validateCoupon(parsed.data);
    const code = parsed.data.code.toUpperCase();
    await ensureUniqueCode(code);
    const coupon = await db.$transaction(async (tx) => {
      const created = await tx.coupon.create({
        data: { ...parsed.data, id: undefined, code },
      });
      await createAuditLog(tx, {
        actor: admin,
        action: "COUPON_CREATED",
        entityType: "Coupon",
        entityId: created.id,
        afterData: { code: created.code, type: created.type, value: Number(created.value) },
      });
      return created;
    });
    return Response.json(serializeCoupon(coupon), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requirePermission("COUPON_MANAGE");
    const parsed = couponSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin mã giảm giá không hợp lệ");
    }
    validateCoupon(parsed.data);
    const code = parsed.data.code.toUpperCase();
    await ensureUniqueCode(code, parsed.data.id);
    const existing = await db.coupon.findUnique({ where: { id: parsed.data.id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy mã giảm giá");
    const coupon = await db.$transaction(async (tx) => {
      const updated = await tx.coupon.update({
        where: { id: parsed.data.id },
        data: {
          code,
          type: parsed.data.type,
          value: parsed.data.value,
          minSpend: parsed.data.minSpend,
          maxSpend: parsed.data.maxSpend,
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          usageLimit: parsed.data.usageLimit,
          isActive: parsed.data.isActive,
        },
      });
      await createAuditLog(tx, {
        actor: admin,
        action: "COUPON_UPDATED",
        entityType: "Coupon",
        entityId: updated.id,
        beforeData: { code: existing.code, isActive: existing.isActive, value: Number(existing.value) },
        afterData: { code: updated.code, isActive: updated.isActive, value: Number(updated.value) },
      });
      return updated;
    });
    return Response.json(serializeCoupon(coupon));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requirePermission("COUPON_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã giảm giá");
    await db.$transaction(async (tx) => {
      const coupon = await tx.coupon.update({ where: { id }, data: { isActive: false } });
      await createAuditLog(tx, {
        actor: admin,
        action: "COUPON_DEACTIVATED",
        entityType: "Coupon",
        entityId: coupon.id,
        beforeData: { isActive: true },
        afterData: { isActive: false },
      });
    });
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
