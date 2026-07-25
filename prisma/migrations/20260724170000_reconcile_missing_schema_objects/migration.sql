-- Reconcile objects that are present in schema.prisma and the production
-- database but were omitted from the committed migration history.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW';

CREATE TABLE IF NOT EXISTS "EmailOutbox" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ChatStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailOutbox_status_nextRetryAt_idx"
    ON "EmailOutbox"("status", "nextRetryAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_userId_key"
    ON "Conversation"("userId");
CREATE INDEX IF NOT EXISTS "Conversation_status_idx"
    ON "Conversation"("status");
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx"
    ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx"
    ON "Message"("createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Conversation_userId_fkey'
          AND conrelid = '"Conversation"'::regclass
    ) THEN
        ALTER TABLE "Conversation"
            ADD CONSTRAINT "Conversation_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Message_conversationId_fkey'
          AND conrelid = '"Message"'::regclass
    ) THEN
        ALTER TABLE "Message"
            ADD CONSTRAINT "Message_conversationId_fkey"
            FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
