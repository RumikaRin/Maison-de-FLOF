import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";
import { passwordSchema } from "@/lib/password-policy";
import { invalidateUserSessionCache } from "@/lib/auth/session-cache";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message || "Mật khẩu mới không hợp lệ",
      );
    }

    const user = await db.user.findUnique({ where: { email: sessionUser.email } });
    if (!user?.password) throw new ApiError(400, "Tài khoản không sử dụng mật khẩu");
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) throw new ApiError(400, "Mật khẩu hiện tại không chính xác");

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      throw new ApiError(400, "Mật khẩu mới phải khác mật khẩu hiện tại");
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      // Invalidate all other active sessions across other devices
      await tx.authSession.updateMany({
        where: {
          userId: user.id,
          id: sessionUser.sessionId ? { not: sessionUser.sessionId } : undefined,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    });

    await invalidateUserSessionCache(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
