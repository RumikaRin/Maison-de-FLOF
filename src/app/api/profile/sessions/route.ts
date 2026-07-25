import { z } from "zod";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

const revokeSchema = z
  .object({
    id: z.string().min(1).optional(),
    allOthers: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.id) !== Boolean(value.allOthers), {
    message: "Chọn một phiên hoặc tất cả phiên khác",
  });

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const sessions = await db.authSession.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });

    return Response.json(
      sessions.map((session) => ({
        ...session,
        current: session.id === user.sessionId,
      })),
    );
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const parsed = revokeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message || "Yêu cầu không hợp lệ",
      );
    }

    const result = await db.authSession.updateMany({
      where: parsed.data.allOthers
        ? {
            userId: user.id,
            id: { not: user.sessionId },
            revokedAt: null,
          }
        : {
            userId: user.id,
            id: parsed.data.id,
            revokedAt: null,
          },
      data: { revokedAt: new Date() },
    });
    if (!parsed.data.allOthers && result.count === 0) {
      throw new ApiError(404, "Không tìm thấy phiên đăng nhập");
    }

    return Response.json({ success: true, revoked: result.count });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
