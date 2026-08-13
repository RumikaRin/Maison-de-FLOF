import { loadTestFixtures } from "../scripts/test-db-fixtures.ts";
import {
  createTestDatabase,
  resetCommerceFixtures,
} from "../tests/integration/helpers/test-database.ts";

export default async function globalSetup() {
  if (process.env.SKIP_DB_SETUP) return;
  try {
    await loadTestFixtures();
    const database = createTestDatabase();
    try {
      await resetCommerceFixtures(database);
    } finally {
      await database.$disconnect();
    }
  } catch {
    console.warn("[e2e/global-setup] Database connection unavailable; proceeding with app static fallback mode.");
  }
}
