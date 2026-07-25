import test from "node:test";
import assert from "node:assert/strict";
import { buildContentSecurityPolicy } from "../src/lib/security/headers.ts";

test("production CSP excludes unsafe-eval and keeps defensive directives", () => {
  const policy = buildContentSecurityPolicy("production", "nonce-test-value");
  const scriptDirective = policy
    .split("; ")
    .find((part) => part.startsWith("script-src"));

  assert.match(scriptDirective!, /'nonce-nonce-test-value'/);
  assert.match(scriptDirective!, /'strict-dynamic'/);
  assert.doesNotMatch(scriptDirective!, /'unsafe-inline'/);
  assert.doesNotMatch(scriptDirective!, /'unsafe-eval'/);
  assert.equal(policy.includes("object-src 'none'"), true);
  assert.equal(policy.includes("base-uri 'self'"), true);
  assert.equal(policy.includes("frame-ancestors 'none'"), true);
});

test("development CSP permits eval for the Next.js development runtime", () => {
  const policy = buildContentSecurityPolicy("development", "dev-nonce");

  assert.equal(policy.includes("'unsafe-eval'"), true);
  assert.equal(policy.includes("'unsafe-inline'"), true);
});

test("isolated HTTP test mode can disable insecure request upgrades", () => {
  const policy = buildContentSecurityPolicy("production", "test-nonce", {
    upgradeInsecureRequests: false,
  });

  assert.equal(policy.includes("upgrade-insecure-requests"), false);
  assert.equal(policy.includes("'unsafe-eval'"), false);
});
