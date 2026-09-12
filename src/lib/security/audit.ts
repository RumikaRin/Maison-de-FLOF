import { Prisma } from "@prisma/client";

const SENSITIVE_AUDIT_KEY =
  /(password|token|secret|authorization|credential|api[_-]?key)/i;

export function sanitizeAuditData(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null as unknown as Prisma.InputJsonValue;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : (null as unknown as Prisma.InputJsonValue);
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map(
      (entry) =>
        sanitizeAuditData(entry) ??
        (null as unknown as Prisma.InputJsonValue),
    ) as Prisma.InputJsonArray;
  }

  if (typeof value === "object") {
    const output: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_AUDIT_KEY.test(key)) continue;
      const sanitized = sanitizeAuditData(entry);
      if (sanitized !== undefined) output[key] = sanitized;
    }
    return output as Prisma.InputJsonObject;
  }

  return String(value);
}

type Actor = {
  id: string;
  email: string;
};

type AuditInput = {
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: Prisma.InputJsonValue;
  afterData?: Prisma.InputJsonValue;
};

type AuditWriter = Pick<Prisma.TransactionClient, "auditLog">;

export function createAuditLog(tx: AuditWriter, input: AuditInput) {
  return tx.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeData: sanitizeAuditData(input.beforeData),
      afterData: sanitizeAuditData(input.afterData),
    },
  });
}
