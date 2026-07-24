import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { assertCronAuthorized } from "@/lib/cron-auth";
import {
  dispatchOutboxRecord,
  OutboxDispatchError,
} from "@/lib/email-outbox";
import { EmailDeliveryError } from "@/lib/email-delivery";
import { writeOperationalLog } from "@/lib/operational-log";

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
      try {
        await dispatchOutboxRecord(record, sendOrderConfirmationEmail);

        await db.emailOutbox.update({
          where: { id: record.id },
          data: { status: "SENT", updatedAt: new Date() },
        });

        results.push({ id: record.id, status: "SENT" });
      } catch (error: unknown) {
        const retryCount = record.retryCount + 1;
        const nextRetryMinutes = retryCount === 1 ? 1 : retryCount === 2 ? 5 : 15;
        const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60000);
        const message =
          error instanceof EmailDeliveryError ||
          error instanceof OutboxDispatchError
            ? error.code
            : "UNKNOWN_ERROR";

        await db.emailOutbox.update({
          where: { id: record.id },
          data: {
            status: "FAILED",
            error: message,
            retryCount,
            nextRetryAt,
            updatedAt: new Date(),
          },
        });

        results.push({ id: record.id, status: "FAILED", error: message });
      }
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
    return NextResponse.json({ error: "Failed to process outbox" }, { status: 500 });
  }
}
