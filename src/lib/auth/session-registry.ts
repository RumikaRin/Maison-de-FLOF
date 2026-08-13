import { createHash } from "node:crypto";
import type { RoleType } from "@prisma/client";

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const LAST_SEEN_WRITE_INTERVAL_MS = 15 * 60 * 1000;

type SessionState = {
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: {
    email: string;
    sessionVersion: number;
    role: { type: RoleType };
  };
};

type SessionDatabase = {
  authSession: {
    create(input: {
      data: {
        userId: string;
        expiresAt: Date;
        userAgentHash: string | null;
        ipHash: string | null;
      };
      select: { id: true; createdAt: true; expiresAt: true };
    }): Promise<{ id: string; createdAt: Date; expiresAt: Date }>;
    findUnique(input: {
      where: { id: string };
      include: { user: { include: { role: true } } };
    }): Promise<SessionState | null>;
    updateMany(input: {
      where: {
        id: string;
        revokedAt: null;
        lastSeenAt: { lt: Date };
      };
      data: { lastSeenAt: Date };
    }): Promise<{ count: number }>;
  };
};

export function hashSessionMetadata(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return null;
  return createHash("sha256").update(normalized).digest("hex");
}

export function evaluateSessionState(
  session: SessionState | null,
  expected: { userId: string; sessionVersion: number; now?: Date },
):
  | {
      valid: true;
      email: string;
      role: RoleType;
      sessionVersion: number;
    }
  | { valid: false } {
  const now = expected.now ?? new Date();
  if (
    !session ||
    session.userId !== expected.userId ||
    session.revokedAt ||
    session.expiresAt <= now ||
    session.user.sessionVersion !== expected.sessionVersion
  ) {
    return { valid: false };
  }

  return {
    valid: true,
    email: session.user.email,
    role: session.user.role.type,
    sessionVersion: session.user.sessionVersion,
  };
}

export async function createRegisteredSession(
  database: SessionDatabase,
  input: {
    userId: string;
    userAgent?: string | null;
    ip?: string | null;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  return database.authSession.create({
    data: {
      userId: input.userId,
      expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_MS),
      userAgentHash: hashSessionMetadata(input.userAgent),
      ipHash: hashSessionMetadata(input.ip),
    },
    select: { id: true, createdAt: true, expiresAt: true },
  });
}

export async function validateRegisteredSession(
  database: SessionDatabase,
  input: {
    sessionId: string;
    userId: string;
    sessionVersion: number;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  const session = await database.authSession.findUnique({
    where: { id: input.sessionId },
    include: { user: { include: { role: true } } },
  });
  const result = evaluateSessionState(session, {
    userId: input.userId,
    sessionVersion: input.sessionVersion,
    now,
  });

  if (result.valid) {
    await database.authSession.updateMany({
      where: {
        id: input.sessionId,
        revokedAt: null,
        lastSeenAt: {
          lt: new Date(now.getTime() - LAST_SEEN_WRITE_INTERVAL_MS),
        },
      },
      data: { lastSeenAt: now },
    });
  }

  return result;
}
