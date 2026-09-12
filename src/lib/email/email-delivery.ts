export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type EmailTransport = {
  send(message: EmailMessage & { from: string }): Promise<unknown>;
};

export class EmailDeliveryError extends Error {
  readonly code: "NOT_CONFIGURED" | "PROVIDER_ERROR";

  constructor(
    code: "NOT_CONFIGURED" | "PROVIDER_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
    this.code = code;
  }
}

export function createEmailSender(
  transport: EmailTransport | null,
  from: string | undefined,
) {
  return async (message: EmailMessage) => {
    if (!transport || !from?.trim()) {
      throw new EmailDeliveryError(
        "NOT_CONFIGURED",
        "Email delivery is not configured",
      );
    }

    try {
      await transport.send({ from, ...message });
    } catch {
      throw new EmailDeliveryError(
        "PROVIDER_ERROR",
        "Email provider rejected the delivery",
      );
    }
  };
}
