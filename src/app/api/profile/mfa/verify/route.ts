import { z } from "zod";
import { ApiError, apiErrorResponse, requireAdmin } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { enableMfa } from "@/services/mfa.service";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Mã xác minh không hợp lệ");

    const recoveryCodes = await enableMfa(admin.id, parsed.data.code);
    if (!recoveryCodes) {
      throw new ApiError(400, "Mã xác minh không hợp lệ hoặc thiết lập đã hết hạn");
    }
    await createAuditLog(db, {
      actor: admin,
      action: "MFA_ENABLED",
      entityType: "MfaCredential",
      entityId: admin.id,
    });
    return Response.json({ success: true, recoveryCodes });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
