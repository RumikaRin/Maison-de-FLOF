import test from "node:test";
import assert from "node:assert/strict";
import { buildContentSecurityPolicy } from "../src/lib/security/headers.ts";

test("production CSP excludes unsafe-eval and keeps defensive directives", () => {
  const policy = buildContentSecurityPolicy("production");

  assert.equal(policy.includes("'unsafe-eval'"), false);
  assert.equal(policy.includes("object-src 'none'"), true);
  assert.equal(policy.includes("base-uri 'self'"), true);
  assert.equal(policy.includes("frame-ancestors 'none'"), true);
});

test("development CSP permits eval for the Next.js development runtime", () => {
  const policy = buildContentSecurityPolicy("development");

  assert.equal(policy.includes("'unsafe-eval'"), true);
});
