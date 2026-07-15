import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { assertCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

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
      return NextResponse.json({ message: "No pending emails" });
    }

    const results = [];

    for (const record of pendingEmails) {
      try {
        if (record.type === "ORDER_CONFIRMATION") {
          const payload = record.payload as {
            email: string;
            fullName: string;
            orderNumber: string;
            total: number;
          };
          await sendOrderConfirmationEmail(
            payload.email,
            payload.fullName,
            payload.orderNumber,
            payload.total,
          );
        } else if (record.type === "PASSWORD_RESET") {
          // Password reset emails are sent inline for lower latency;
          // keep branch for future outbox processing if needed.
        }

        await db.emailOutbox.update({
          where: { id: record.id },
          data: { status: "SENT", updatedAt: new Date() },
        });

        results.push({ id: record.id, status: "SENT" });
      } catch (error: unknown) {
        console.error(`Failed to send email ${record.id}:`, error);

        const retryCount = record.retryCount + 1;
        const nextRetryMinutes = retryCount === 1 ? 1 : retryCount === 2 ? 5 : 15;
        const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60000);
        const message = error instanceof Error ? error.message : "Unknown error";

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

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("Cron outbox error:", error);
    return NextResponse.json({ error: "Failed to process outbox" }, { status: 500 });
  }
}
