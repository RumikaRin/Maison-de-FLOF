import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const user = await db.user.findUnique({
      where: { email: sessionUser.email },
      include: {
        role: true,
        mfaCredential: { select: { enabledAt: true } },
      },
    });
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");

    return NextResponse.json({
      email: user.email,
      name: user.name || "",
      phone: user.phone || "",
      role: user.role.type,
      // Surfaced so profile settings can offer verification on demand — it is
      // optional for customers, not a gate (see lib/auth/email-verification).
      emailVerified: Boolean(user.emailVerified),
      mfaEnabled:
        user.role.type === "ADMIN" && Boolean(user.mfaCredential?.enabledAt),
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin cá nhân không hợp lệ");

    const user = await db.user.update({
      where: { email: sessionUser.email },
      data: parsed.data,
      include: {
        role: true,
        mfaCredential: { select: { enabledAt: true } },
      },
    });
    return NextResponse.json({
      email: user.email,
      name: user.name || "",
      phone: user.phone || "",
      role: user.role.type,
      // Surfaced so profile settings can offer verification on demand — it is
      // optional for customers, not a gate (see lib/auth/email-verification).
      emailVerified: Boolean(user.emailVerified),
      mfaEnabled:
        user.role.type === "ADMIN" && Boolean(user.mfaCredential?.enabledAt),
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
