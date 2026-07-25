import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CI uses Node 24 actions and preserves the release gate order", async () => {
  const source = await readFile(".github/workflows/ci.yml", "utf8");

  assert.match(source, /actions\/checkout@v5/);
  assert.match(source, /actions\/setup-node@v5/);
  assert.doesNotMatch(source, /actions\/(?:checkout|setup-node)@v4/);
  assert.match(source, /node-version:\s*24/);
  assert.match(source, /image:\s*postgres:18/);

  const orderedCommands = [
    "npm run test:db:migrate",
    "npm run test:db:fixtures",
    "npm run lint",
    "npm test",
    "npm run test:env",
    "npm run test:integration",
    "npm run build",
    "npm run typecheck",
    "npm run test:e2e",
    "npm run test:openapi",
    "npm run test:lighthouse",
    "npm audit --omit=dev --audit-level=high",
  ];
  let previousIndex = -1;
  for (const command of orderedCommands) {
    const index = source.indexOf(command);
    assert.ok(index > previousIndex, `${command} is missing or out of order`);
    previousIndex = index;
  }
});
