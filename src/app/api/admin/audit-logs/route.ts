import { db } from "@/lib/db";
import { apiErrorResponse, requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const searchParams = new URL(request.url).searchParams;
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const logs = await db.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return Response.json(logs);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
