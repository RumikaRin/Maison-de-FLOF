import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireAdmin } from "@/lib/api-auth";
import { passwordSchema } from "@/lib/password-policy";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: passwordSchema,
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]),
});

const updateRoleSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]),
});

function serializeUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: { type: "CUSTOMER" | "STAFF" | "ADMIN" };
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name || "",
    email: user.email,
    role: user.role.type,
    password: "••••••••",
    createdAt: user.createdAt.toISOString().split("T")[0],
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users.map(serializeUser));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin tài khoản không hợp lệ");
    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) throw new ApiError(409, "Email đã tồn tại");
    const role = await db.role.findUnique({ where: { type: parsed.data.role } });
    if (!role) throw new ApiError(500, "Role chưa được khởi tạo");

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: await bcrypt.hash(parsed.data.password, 12),
        roleId: role.id,
        customer:
          parsed.data.role === "CUSTOMER" ? { create: { customerType: "RETAIL" } } : undefined,
      },
      include: { role: true },
    });
    return NextResponse.json(serializeUser(user), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const parsed = updateRoleSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Role không hợp lệ");
    const target = await db.user.findUnique({ where: { id: parsed.data.id } });
    if (!target) throw new ApiError(404, "Không tìm thấy tài khoản");
    if (target.email === admin.email && parsed.data.role !== "ADMIN") {
      throw new ApiError(400, "Không thể tự hạ quyền tài khoản đang đăng nhập");
    }
    const role = await db.role.findUnique({ where: { type: parsed.data.role } });
    if (!role) throw new ApiError(500, "Role chưa được khởi tạo");

    const user = await db.$transaction(async (tx) => {
      if (parsed.data.role === "CUSTOMER") {
        await tx.customer.upsert({
          where: { userId: target.id },
          update: {},
          create: { userId: target.id, customerType: "RETAIL" },
        });
      }
      return tx.user.update({
        where: { id: target.id },
        data: { roleId: role.id },
        include: { role: true },
      });
    });
    return NextResponse.json(serializeUser(user));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã tài khoản");
    const target = await db.user.findUnique({
      where: { id },
      include: { customer: { include: { orders: { select: { id: true }, take: 1 } } } },
    });
    if (!target) throw new ApiError(404, "Không tìm thấy tài khoản");
    if (target.email === admin.email) {
      throw new ApiError(400, "Không thể xóa tài khoản đang đăng nhập");
    }
    if (target.customer?.orders.length) {
      throw new ApiError(409, "Không thể xóa tài khoản đã có đơn hàng");
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
