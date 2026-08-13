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
    "AUTH_URL",
    "AUTH_MFA_ENCRYPTION_KEY",
    "NEXT_PUBLIC_APP_URL",
    "CRON_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "KV_REST_API_URL or UPSTASH_REDIS_REST_URL",
    "KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN",
  ]);
  const output = missing.join(",");
  assert.equal(output.includes(environment.DATABASE_URL), false);
  assert.equal(output.includes(environment.AUTH_SECRET), false);
});

test("accepts a complete synthetic production environment with Vercel Redis", () => {
  const environment = Object.fromEntries(
    REQUIRED_PRODUCTION_VARIABLES.map((name) => [name, `synthetic-${name}`]),
  );
  environment.KV_REST_API_URL = "https://vercel-redis.example";
  environment.KV_REST_API_TOKEN = "vercel-token";

  assert.deepEqual(getMissingProductionVariables(environment), []);
});

test("requires non-alternative provider and public URL variable names", () => {
  assert.deepEqual(REQUIRED_PRODUCTION_VARIABLES, [
    "DATABASE_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "AUTH_MFA_ENCRYPTION_KEY",
    "NEXT_PUBLIC_APP_URL",
    "CRON_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ]);
});
