import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { passwordSchema } from "@/lib/password-policy";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { invalidateUserSessionCache } from "@/lib/auth/session-cache";

const schema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  token: z.string().trim().min(32).max(200),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message || "Yêu cầu đặt lại mật khẩu không hợp lệ",
      );
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, password: true },
    });
    if (!user?.password) {
      throw new ApiError(400, "Tài khoản không hỗ trợ đặt lại mật khẩu");
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    await db.$transaction(async (tx) => {
      const valid = await consumePasswordResetToken(parsed.data.email, parsed.data.token, tx);
      if (!valid) {
        throw new ApiError(400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await invalidateUserSessionCache(user.id);

    return Response.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
