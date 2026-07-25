import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("PostgreSQL 18 test container mounts the version-aware data root", () => {
  const compose = readFileSync("docker-compose.test.yml", "utf8");

  assert.match(compose, /- \/var\/lib\/postgresql\s*$/m);
  assert.doesNotMatch(compose, /- \/var\/lib\/postgresql\/data\s*$/m);
});
