import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { loadTestFixtures } from "../../scripts/test-db-fixtures.ts";
import {
  createTestDatabase,
  resetCustomerWorkflowFixtures,
} from "./helpers/test-database.ts";

const database = createTestDatabase();

before(async () => {
  await loadTestFixtures();
});

beforeEach(async () => {
  await resetCustomerWorkflowFixtures(database);
});

after(async () => {
  await resetCustomerWorkflowFixtures(database);
  await database.$disconnect();
});

test("workflow cleanup removes only namespaced quote fixtures", async () => {
  await database.quoteRequest.create({
    data: {
      fullName: "Integration workflow cleanup",
      phone: "0900000000",
      email: "integration-workflow-cleanup@flof.test",
      projectType: "Residential",
      message: "integration-workflow-cleanup quote",
    },
  });

  await resetCustomerWorkflowFixtures(database);

  assert.equal(
    await database.quoteRequest.count({
      where: { email: "integration-workflow-cleanup@flof.test" },
    }),
    0,
  );
});
