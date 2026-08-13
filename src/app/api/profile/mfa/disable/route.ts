import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError, apiErrorResponse, requireAdmin } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { disableMfa } from "@/services/mfa.service";

const schema = z.object({
  password: z.string().min(1).max(200),
  code: z.string().trim().min(6).max(40),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Yêu cầu không hợp lệ");

    const user = await db.user.findUnique({
      where: { id: admin.id },
      select: { password: true },
    });
    if (
      !user?.password ||
      !(await bcrypt.compare(parsed.data.password, user.password))
    ) {
      throw new ApiError(400, "Không thể xác minh thông tin");
    }
    if (!(await disableMfa(admin.id, parsed.data.code))) {
      throw new ApiError(400, "Không thể xác minh thông tin");
    }
    await createAuditLog(db, {
      actor: admin,
      action: "MFA_DISABLED",
      entityType: "MfaCredential",
      entityId: admin.id,
    });
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
