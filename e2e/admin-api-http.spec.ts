import { expect, test } from "@playwright/test";
import {
  createTestDatabase,
  resetHttpApiFixtures,
} from "../tests/integration/helpers/test-database.ts";

const database = createTestDatabase();

test.afterAll(async () => {
  await resetHttpApiFixtures(database);
  await database.$disconnect();
});

test("HTTP fixture cleanup is namespaced", async () => {
  await database.category.create({
    data: {
      name: "HTTP cleanup fixture",
      slug: "integration-http-cleanup",
    },
  });

  await resetHttpApiFixtures(database);

  await expect(
    database.category.findUnique({
      where: { slug: "integration-http-cleanup" },
    }),
  ).resolves.toBeNull();
  await expect(
    database.category.findUnique({
      where: { slug: "integration-paints" },
    }),
  ).resolves.not.toBeNull();
});
