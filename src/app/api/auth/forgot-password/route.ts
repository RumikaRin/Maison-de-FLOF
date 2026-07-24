import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { EmailDeliveryError } from "@/lib/email-delivery";

const schema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
});

/**
 * Always returns success to avoid email enumeration.
 * Only creates a token + sends mail when the account has a local password.
 */
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Email không hợp lệ");
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, password: true, name: true },
    });

    if (user?.password) {
      const { rawToken } = await createPasswordResetToken(user.email);
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.AUTH_URL ||
        "http://localhost:3000";
      const resetUrl = new URL("/reset-password", baseUrl);
      resetUrl.searchParams.set("token", rawToken);
      resetUrl.searchParams.set("email", user.email);
      try {
        await sendPasswordResetEmail(
          user.email,
          user.name || "Khách hàng",
          resetUrl.toString(),
        );
      } catch (error) {
        console.error(
          "Password reset email delivery failed:",
          error instanceof EmailDeliveryError ? error.code : "UNKNOWN_ERROR",
        );
      }
    }

    return Response.json({
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
