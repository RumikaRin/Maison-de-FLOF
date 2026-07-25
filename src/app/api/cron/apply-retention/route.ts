import { db } from "@/lib/db";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { jsonApiError } from "@/lib/api-error-contract";
import { writeOperationalLog } from "@/lib/operations/log";
import { applyPrivacyRetention } from "@/services/privacy.service";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const correlationId = request.headers.get("x-vercel-id") ?? undefined;
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    const deleted = await applyPrivacyRetention(db);
    writeOperationalLog("info", "cron.privacy_retention.completed", {
      route: "/api/cron/apply-retention",
      correlationId,
      durationMs: Date.now() - startedAt,
      ...deleted,
    });
    return Response.json({ data: deleted });
  } catch {
    writeOperationalLog("error", "cron.privacy_retention.failed", {
      route: "/api/cron/apply-retention",
      correlationId,
      durationMs: Date.now() - startedAt,
      errorCode: "RETENTION_FAILED",
    });
    return jsonApiError(
      request,
      500,
      "INTERNAL_ERROR",
      "Privacy retention failed",
    );
  }
}
