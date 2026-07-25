import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { passwordSchema } from "@/lib/password-policy";
import { EmailDeliveryError } from "@/lib/email-delivery";

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

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: await bcrypt.hash(parsed.data.password, 12),
        roleId: customerRole.id,
        customer: { create: { customerType: "RETAIL" } },
      },
    });
    try {
      await sendWelcomeEmail(user.email, user.name || "Khách hàng");
    } catch (error) {
      console.error(
        "Welcome email delivery failed:",
        error instanceof EmailDeliveryError ? error.code : "UNKNOWN_ERROR",
      );
    }
    return Response.json({ success: true, email: user.email }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
