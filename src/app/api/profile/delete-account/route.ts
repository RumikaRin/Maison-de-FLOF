import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  ApiError,
  apiErrorResponse,
  requireUser,
} from "@/lib/api-auth";
import { db } from "@/lib/db";
import { anonymizeUserData } from "@/services/privacy.service";

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  password: z.string().max(200).optional(),
});

export async function DELETE(request: Request) {
  try {
    const actor = await requireUser();
    if (actor.role !== "CUSTOMER") {
      throw new ApiError(403, "Chỉ tài khoản khách hàng có thể tự xóa");
    }
    const parsed = deleteAccountSchema.parse(await request.json());
    const user = await db.user.findUnique({
      where: { id: actor.id },
      select: { password: true },
    });
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
    if (
      user.password &&
      (!parsed.password ||
        !(await bcrypt.compare(parsed.password, user.password)))
    ) {
      throw new ApiError(403, "Mật khẩu hiện tại không chính xác");
    }

    await anonymizeUserData(db, actor.id);
    return Response.json({
      data: {
        deleted: true,
        message: "Tài khoản đã được ẩn danh và mọi phiên đã bị thu hồi",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
