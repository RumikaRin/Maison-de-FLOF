import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { consumeEmailVerificationToken } from "@/lib/auth/email-verification";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { EmailDeliveryError } from "@/lib/email-delivery";
import { writeOperationalLog } from "@/lib/operations/log";

const schema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  token: z.string().trim().min(32).max(200),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Yêu cầu xác minh email không hợp lệ");
    }

    const verified = await consumeEmailVerificationToken(
      db,
      parsed.data.email,
      parsed.data.token,
    );
    if (!verified) {
      throw new ApiError(400, "Liên kết xác minh không hợp lệ hoặc đã hết hạn");
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { email: true, name: true },
    });
    if (user) {
      try {
        await sendWelcomeEmail(user.email, user.name || "Khách hàng");
      } catch (error) {
        writeOperationalLog("error", "email.welcome.delivery_failed", {
          errorCode:
            error instanceof EmailDeliveryError ? error.code : "UNKNOWN_ERROR",
        });
      }
    }

    return Response.json({
      success: true,
      message: "Xác minh email thành công",
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
