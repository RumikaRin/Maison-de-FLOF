import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-auth";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { db } from "@/lib/db";
import { sendEmailVerificationEmail } from "@/lib/email";
import { EmailDeliveryError } from "@/lib/email-delivery";

const schema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const genericMessage =
  "Nếu tài khoản cần xác minh, chúng tôi đã gửi một liên kết mới.";

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ success: true, message: genericMessage });
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        email: true,
        emailVerified: true,
        password: true,
        name: true,
      },
    });

    if (user?.password && !user.emailVerified) {
      const verification = await createEmailVerificationToken(db, user.email);
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.AUTH_URL ||
        "http://localhost:3000";
      const verifyUrl = new URL("/verify-email", baseUrl);
      verifyUrl.searchParams.set("email", verification.email);
      verifyUrl.searchParams.set("token", verification.token);
      try {
        await sendEmailVerificationEmail(
          user.email,
          user.name || "Khách hàng",
          verifyUrl.toString(),
        );
      } catch (error) {
        console.error(
          "Email verification delivery failed:",
          error instanceof EmailDeliveryError ? error.code : "UNKNOWN_ERROR",
        );
      }
    }

    return Response.json({ success: true, message: genericMessage });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
