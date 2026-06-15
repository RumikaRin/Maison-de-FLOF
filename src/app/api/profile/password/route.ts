import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Mật khẩu mới phải có ít nhất 8 ký tự");
    }

    const user = await db.user.findUnique({ where: { email: sessionUser.email } });
    if (!user?.password) throw new ApiError(400, "Tài khoản không sử dụng mật khẩu");
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) throw new ApiError(400, "Mật khẩu hiện tại không chính xác");

    await db.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(parsed.data.newPassword, 12) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
