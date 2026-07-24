import assert from "node:assert/strict";
import test from "node:test";
import {
  getMissingProductionVariables,
  REQUIRED_PRODUCTION_VARIABLES,
} from "../scripts/check-release-environment.ts";

test("reports only missing production variable names", () => {
  const environment = {
    DATABASE_URL: "postgresql://contains-a-sensitive-value",
    AUTH_SECRET: "super-secret-auth-value",
    CRON_SECRET: "   ",
  };

  const missing = getMissingProductionVariables(environment);

  assert.deepEqual(missing, [
    "CRON_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ]);
  assert.equal(missing.includes(environment.DATABASE_URL), false);
  assert.equal(missing.includes(environment.AUTH_SECRET), false);
});

test("accepts a complete synthetic production environment", () => {
  const environment = Object.fromEntries(
    REQUIRED_PRODUCTION_VARIABLES.map((name) => [name, `synthetic-${name}`]),
  );

  assert.deepEqual(getMissingProductionVariables(environment), []);
});
