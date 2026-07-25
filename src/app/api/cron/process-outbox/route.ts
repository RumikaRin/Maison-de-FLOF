import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { processEmailOutboxRecord } from "@/lib/process-email-outbox";
import { writeOperationalLog } from "@/lib/operations/log";
import { jsonApiError } from "@/lib/api-error-contract";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const correlationId = request.headers.get("x-vercel-id") ?? undefined;
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) {
    writeOperationalLog("error", "cron.outbox.unauthorized", {
      route: "/api/cron/process-outbox",
      correlationId,
      durationMs: Date.now() - startedAt,
      errorCode: "UNAUTHORIZED",
    });
    return unauthorized;
  }

  try {
    const pendingEmails = await db.emailOutbox.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "FAILED", retryCount: { lt: 3 }, nextRetryAt: { lte: new Date() } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "asc" },
    });

    if (pendingEmails.length === 0) {
      writeOperationalLog("info", "cron.outbox.completed", {
        route: "/api/cron/process-outbox",
        correlationId,
        durationMs: Date.now() - startedAt,
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
      return NextResponse.json({ message: "No pending emails" });
    }

    const results = [];

    for (const record of pendingEmails) {
      results.push(
        await processEmailOutboxRecord(
          db,
          record,
          sendOrderConfirmationEmail,
        ),
      );
    }

    const succeeded = results.filter((result) => result.status === "SENT").length;
    const failed = results.length - succeeded;
    writeOperationalLog("info", "cron.outbox.completed", {
      route: "/api/cron/process-outbox",
      correlationId,
      durationMs: Date.now() - startedAt,
      processed: results.length,
      succeeded,
      failed,
    });
    return NextResponse.json({ processed: results.length, results });
  } catch {
    writeOperationalLog("error", "cron.outbox.failed", {
      route: "/api/cron/process-outbox",
      correlationId,
      durationMs: Date.now() - startedAt,
      errorCode: "UNEXPECTED_ERROR",
    });
    return jsonApiError(
      request,
      500,
      "INTERNAL_ERROR",
      "Failed to process outbox",
    );
  }
}
