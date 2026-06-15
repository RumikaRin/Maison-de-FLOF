import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(request: Request) {
  // Simple auth for cron endpoints
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch pending or failed emails (up to 3 retries)
    // @ts-ignore
    const pendingEmails = await db.emailOutbox.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "FAILED", retryCount: { lt: 3 }, nextRetryAt: { lte: new Date() } }
        ]
      },
      take: 10, // Process batch of 10
      orderBy: { createdAt: "asc" }
    });

    if (pendingEmails.length === 0) {
      return NextResponse.json({ message: "No pending emails" });
    }

    const results = [];

    for (const record of pendingEmails) {
      try {
        if (record.type === "ORDER_CONFIRMATION") {
          const payload = record.payload as any;
          await sendOrderConfirmationEmail(
            payload.email,
            payload.fullName,
            payload.orderNumber,
            payload.total
          );
        }

        // @ts-ignore
        await db.emailOutbox.update({
          where: { id: record.id },
          data: { status: "SENT", updatedAt: new Date() }
        });
        
        results.push({ id: record.id, status: "SENT" });
      } catch (error: any) {
        console.error(`Failed to send email ${record.id}:`, error);
        
        const retryCount = record.retryCount + 1;
        // Exponential backoff for retries: 1min, 5min, 15min
        const nextRetryMinutes = retryCount === 1 ? 1 : retryCount === 2 ? 5 : 15;
        const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60000);

        // @ts-ignore
        await db.emailOutbox.update({
          where: { id: record.id },
          data: { 
            status: "FAILED", 
            error: error.message || "Unknown error",
            retryCount,
            nextRetryAt,
            updatedAt: new Date()
          }
        });

        results.push({ id: record.id, status: "FAILED", error: error.message });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("Cron outbox error:", error);
    return NextResponse.json({ error: "Failed to process outbox" }, { status: 500 });
  }
}
