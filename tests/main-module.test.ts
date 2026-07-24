import assert from "node:assert/strict";
import test from "node:test";
import { isMainModule } from "../scripts/is-main-module.ts";

test("detects a Windows script path as the active ES module", () => {
  assert.equal(
    isMainModule(
      "file:///D:/ProjectZ/FLOF/scripts/test-db-fixtures.ts",
      "D:\\ProjectZ\\FLOF\\scripts\\test-db-fixtures.ts",
    ),
    true,
  );
});

test("rejects an imported module", () => {
  assert.equal(
    isMainModule(
      "file:///D:/ProjectZ/FLOF/scripts/test-db-fixtures.ts",
      "D:\\ProjectZ\\FLOF\\tests\\some-test.ts",
    ),
    false,
  );
});
