import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "prisma/migrations/20260724170000_reconcile_missing_schema_objects/migration.sql";

test("migration history reconciles every model already present in the Prisma schema", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(
    migration,
    /ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW'/,
  );
  assert.match(
    migration,
    /CREATE TABLE IF NOT EXISTS "EmailOutbox"/,
  );
  assert.match(
    migration,
    /CREATE TABLE IF NOT EXISTS "Conversation"/,
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "Message"/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS/);
  assert.match(migration, /FROM pg_constraint/);
});
