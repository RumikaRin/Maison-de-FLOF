import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { isMainModule } from "../scripts/is-main-module.ts";

test("detects a platform-native script path as the active ES module", () => {
  const entryPath = resolve("scripts/test-db-fixtures.ts");

  assert.equal(
    isMainModule(pathToFileURL(entryPath).href, entryPath),
    true,
  );
});

test("rejects an imported module", () => {
  const modulePath = resolve("scripts/test-db-fixtures.ts");
  const entryPath = resolve("tests/some-test.ts");

  assert.equal(
    isMainModule(pathToFileURL(modulePath).href, entryPath),
    false,
  );
});
