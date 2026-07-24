import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { loadTestFixtures, TEST_FIXTURES } from "../../scripts/test-db-fixtures.ts";
import { createAuditLog } from "../../src/lib/audit.ts";
import { createTestDatabase } from "./helpers/test-database.ts";

const database = createTestDatabase();

before(async () => {
  await loadTestFixtures();
});

beforeEach(async () => {
  await database.auditLog.deleteMany();
});

after(async () => {
  await database.$disconnect();
});

test("persisted audit data removes sensitive keys at every nesting level", async () => {
  const actor = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.adminEmail },
  });

  const created = await createAuditLog(database, {
    actor: { id: actor.id, email: actor.email },
    action: "INTEGRATION_SANITIZE",
    entityType: "SecurityFixture",
    entityId: "audit-integration-1",
    afterData: {
      displayName: "Visible",
      password: "must-not-persist",
      nested: {
        apiKey: "must-not-persist",
        safe: true,
      },
      entries: [{ authorization: "must-not-persist", count: 2 }],
    },
  });
  const persisted = await database.auditLog.findUniqueOrThrow({
    where: { id: created.id },
  });
  const serialized = JSON.stringify(persisted.afterData);

  assert.match(serialized, /Visible/);
  assert.match(serialized, /"safe":true/);
  assert.doesNotMatch(serialized, /must-not-persist/);
  assert.doesNotMatch(serialized, /password|apiKey|authorization/);
});
