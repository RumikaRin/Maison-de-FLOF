import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  province: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(255),
  isDefault: z.boolean().default(false),
});

function serializeAddress(address: {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  addressLine1: string;
  isDefault: boolean;
}) {
  return {
    id: address.id,
    name: address.fullName,
    phone: address.phone,
    province: address.province,
    district: address.district,
    address: address.addressLine1,
    isDefault: address.isDefault,
  };
}

async function getCurrentUser() {
  const sessionUser = await requireUser();
  const user = await db.user.findUnique({ where: { email: sessionUser.email } });
  if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
  return user;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(addresses.map(serializeAddress));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const parsed = addressSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin địa chỉ không hợp lệ");

    const address = await db.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      const isDefault = parsed.data.isDefault || count === 0;
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId: user.id,
          fullName: parsed.data.name,
          phone: parsed.data.phone,
          province: parsed.data.province,
          district: parsed.data.district,
          addressLine1: parsed.data.address,
          isDefault,
        },
      });
    });
    return NextResponse.json(serializeAddress(address), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const parsed = addressSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin địa chỉ không hợp lệ");
    }
    const existing = await db.address.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy địa chỉ");

    const address = await db.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: parsed.data.id },
        data: {
          fullName: parsed.data.name,
          phone: parsed.data.phone,
          province: parsed.data.province,
          district: parsed.data.district,
          addressLine1: parsed.data.address,
          isDefault: parsed.data.isDefault || existing.isDefault,
        },
      });
    });
    return NextResponse.json(serializeAddress(address));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã địa chỉ");
    const existing = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy địa chỉ");
    const linkedOrders = await db.order.count({ where: { addressId: id } });
    if (linkedOrders > 0) {
      throw new ApiError(409, "Không thể xóa địa chỉ đang được lưu trong đơn hàng cũ");
    }

    await db.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
