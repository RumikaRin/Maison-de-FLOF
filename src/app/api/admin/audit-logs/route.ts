import { db } from "@/lib/db";
import { apiErrorResponse, requireAdmin } from "@/lib/api-auth";
import { sanitizeAuditData } from "@/lib/audit";
import { parsePagination } from "@/lib/pagination";

function optionalDate(value: string | null, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
      : value,
  );
  if (Number.isNaN(date.getTime())) {
    throw new SyntaxError("Invalid audit date");
  }
  return date;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const searchParams = new URL(request.url).searchParams;
    const { page, limit } = parsePagination(searchParams, {
      defaultLimit: 25,
      maxLimit: 100,
    });
    const entityType = searchParams.get("entityType")?.trim() || undefined;
    const entityId = searchParams.get("entityId")?.trim() || undefined;
    const actorId = searchParams.get("actorId")?.trim() || undefined;
    const action = searchParams.get("action")?.trim() || undefined;
    const from = optionalDate(searchParams.get("from"));
    const to = optionalDate(searchParams.get("to"), true);
    const where = {
      entityType,
      entityId,
      actorId,
      action,
      createdAt: from || to ? { gte: from, lte: to } : undefined,
    };
    const [logs, total] = await db.$transaction([
      db.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);
    return Response.json({
      data: logs.map((log) => ({
        ...log,
        beforeData: sanitizeAuditData(log.beforeData),
        afterData: sanitizeAuditData(log.afterData),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
