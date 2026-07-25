import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendEmailVerificationEmail } from "@/lib/email";
import { passwordSchema } from "@/lib/password-policy";
import { EmailDeliveryError } from "@/lib/email-delivery";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { writeOperationalLog } from "@/lib/operations/log";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message || "Thông tin đăng ký không hợp lệ",
      );
    }
    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) throw new ApiError(409, "Email đã được đăng ký");
    const customerRole = await db.role.findUnique({ where: { type: "CUSTOMER" } });
    if (!customerRole) throw new ApiError(500, "Role CUSTOMER chưa được khởi tạo");

    const password = await bcrypt.hash(parsed.data.password, 12);
    const { user, verification } = await db.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password,
          roleId: customerRole.id,
          customer: { create: { customerType: "RETAIL" } },
        },
      });
      const createdVerification = await createEmailVerificationToken(
        transaction,
        createdUser.email,
      );
      return { user: createdUser, verification: createdVerification };
    });

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
      writeOperationalLog("error", "email.verification.delivery_failed", {
        errorCode:
          error instanceof EmailDeliveryError ? error.code : "UNKNOWN_ERROR",
      });
    }
    return Response.json({ success: true, email: user.email }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
