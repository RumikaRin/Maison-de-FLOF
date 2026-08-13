import assert from "node:assert/strict";
import test from "node:test";
import { assertTestDatabaseUrl } from "../scripts/assert-test-database.ts";

test("accepts the isolated flof_test database", () => {
  assert.doesNotThrow(() =>
    assertTestDatabaseUrl(
      "postgresql://postgres:postgres@127.0.0.1:55432/flof_test",
    ),
  );
});

test("rejects production-like database names", () => {
  assert.throws(
    () =>
      assertTestDatabaseUrl(
        "postgresql://owner:secret@example.invalid/neondb",
      ),
    /must contain test/i,
  );
});

test("rejects a missing test database URL", () => {
  assert.throws(() => assertTestDatabaseUrl(undefined), /required/i);
});
