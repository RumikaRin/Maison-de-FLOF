import { Prisma } from "@prisma/client";

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

export function createAuditLog(tx: Prisma.TransactionClient, input: AuditInput) {
  return tx.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeData: input.beforeData,
      afterData: input.afterData,
    },
  });
}
