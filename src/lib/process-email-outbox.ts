import { Prisma } from "@prisma/client";
import { EmailDeliveryError } from "@/lib/email-delivery";
import {
  dispatchOutboxRecord,
  OutboxDispatchError,
} from "@/lib/email-outbox";

type OutboxWriter = Pick<Prisma.TransactionClient, "emailOutbox">;

type ProcessableOutboxRecord = {
  id: string;
  type: string;
  payload: unknown;
  retryCount: number;
};

type OrderConfirmationSender = (
  email: string,
  fullName: string,
  orderNumber: string,
  total: number,
) => Promise<unknown>;

export async function processEmailOutboxRecord(
  database: OutboxWriter,
  record: ProcessableOutboxRecord,
  sendOrderConfirmation: OrderConfirmationSender,
  currentTime = () => new Date(),
) {
  try {
    await dispatchOutboxRecord(record, sendOrderConfirmation);
    await database.emailOutbox.update({
      where: { id: record.id },
      data: { status: "SENT", error: null, nextRetryAt: null, updatedAt: currentTime() },
    });

    return { id: record.id, status: "SENT" as const };
  } catch (error: unknown) {
    const retryCount = record.retryCount + 1;
    const nextRetryMinutes = retryCount === 1 ? 1 : retryCount === 2 ? 5 : 15;
    const now = currentTime();
    const nextRetryAt = new Date(now.getTime() + nextRetryMinutes * 60_000);
    const message =
      error instanceof EmailDeliveryError || error instanceof OutboxDispatchError
        ? error.code
        : "UNKNOWN_ERROR";

    await database.emailOutbox.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        error: message,
        retryCount,
        nextRetryAt,
        updatedAt: now,
      },
    });

    return {
      id: record.id,
      status: "FAILED" as const,
      error: message,
    };
  }
}
