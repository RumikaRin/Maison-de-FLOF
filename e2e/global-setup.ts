import { loadTestFixtures } from "../scripts/test-db-fixtures.ts";
import {
  createTestDatabase,
  resetCommerceFixtures,
} from "../tests/integration/helpers/test-database.ts";

export default async function globalSetup() {
  await loadTestFixtures();
  const database = createTestDatabase();
  try {
    await resetCommerceFixtures(database);
  } finally {
    await database.$disconnect();
  }
}
