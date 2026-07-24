export function assertTestDatabaseUrl(value: string | undefined) {
  if (!value) {
    throw new Error("TEST_DATABASE_URL is required");
  }

  const databaseName = new URL(value).pathname
    .replace(/^\//, "")
    .toLowerCase();

  if (!databaseName.includes("test")) {
    throw new Error("Test database name must contain test");
  }

  return value;
}
