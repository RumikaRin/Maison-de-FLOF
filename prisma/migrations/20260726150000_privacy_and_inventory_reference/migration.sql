-- Additive privacy lifecycle timestamps.
ALTER TABLE "User"
  ADD COLUMN "privacyConsentAt" TIMESTAMP(3),
  ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);

-- Guest contact requests must carry a durable consent timestamp. Existing
-- records are backfilled with their original submission time.
ALTER TABLE "ChatMessage"
  ADD COLUMN "consentAt" TIMESTAMP(3);

UPDATE "ChatMessage"
SET "consentAt" = "createdAt"
WHERE "consentAt" IS NULL;

ALTER TABLE "ChatMessage"
  ALTER COLUMN "consentAt" SET NOT NULL;

-- Inventory references are typed without changing existing reference IDs.
CREATE TYPE "InventoryReferenceType" AS ENUM (
  'ORDER',
  'IMPORT',
  'MANUAL',
  'UNKNOWN'
);

ALTER TABLE "InventoryTransaction"
  ADD COLUMN "referenceType" "InventoryReferenceType" NOT NULL DEFAULT 'UNKNOWN';

UPDATE "InventoryTransaction"
SET "referenceType" = CASE
  WHEN "type" = 'EXPORT' AND "referenceId" IS NOT NULL THEN 'ORDER'::"InventoryReferenceType"
  WHEN "type" = 'IMPORT' AND "referenceId" IS NOT NULL THEN 'IMPORT'::"InventoryReferenceType"
  WHEN "referenceId" IS NOT NULL THEN 'MANUAL'::"InventoryReferenceType"
  ELSE 'UNKNOWN'::"InventoryReferenceType"
END;

CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx"
  ON "InventoryTransaction"("referenceType", "referenceId");
