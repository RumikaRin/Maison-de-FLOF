type OrderConfirmationSender = (
  email: string,
  fullName: string,
  orderNumber: string,
  total: number,
) => Promise<unknown>;

type OutboxRecord = {
  type: string;
  payload: unknown;
};

export class OutboxDispatchError extends Error {
  readonly code: "INVALID_PAYLOAD" | "UNSUPPORTED_TYPE";

  constructor(
    code: "INVALID_PAYLOAD" | "UNSUPPORTED_TYPE",
    message: string,
  ) {
    super(message);
    this.name = "OutboxDispatchError";
    this.code = code;
  }
}

function parseOrderConfirmationPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OutboxDispatchError(
      "INVALID_PAYLOAD",
      "Order confirmation payload is invalid",
    );
  }

  const value = payload as Record<string, unknown>;
  if (
    typeof value.email !== "string" ||
    typeof value.fullName !== "string" ||
    typeof value.orderNumber !== "string" ||
    typeof value.total !== "number" ||
    !Number.isFinite(value.total)
  ) {
    throw new OutboxDispatchError(
      "INVALID_PAYLOAD",
      "Order confirmation payload is invalid",
    );
  }

  return {
    email: value.email,
    fullName: value.fullName,
    orderNumber: value.orderNumber,
    total: value.total,
  };
}

export async function dispatchOutboxRecord(
  record: OutboxRecord,
  sendOrderConfirmation: OrderConfirmationSender,
) {
  if (record.type !== "ORDER_CONFIRMATION") {
    throw new OutboxDispatchError(
      "UNSUPPORTED_TYPE",
      "Outbox record type is not supported",
    );
  }

  const payload = parseOrderConfirmationPayload(record.payload);
  await sendOrderConfirmation(
    payload.email,
    payload.fullName,
    payload.orderNumber,
    payload.total,
  );
}
