import assert from "node:assert/strict";
import test from "node:test";
import { isGoogleProviderConfigured } from "../src/lib/auth/google-provider-policy.ts";

test("Google OAuth requires both client ID and client secret", () => {
  assert.equal(isGoogleProviderConfigured({}), false);
  assert.equal(
    isGoogleProviderConfigured({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
    }),
    true,
  );
});

test("Google OAuth rejects blank or partial configuration", () => {
  assert.equal(
    isGoogleProviderConfigured({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: " ",
    }),
    false,
  );
  assert.equal(
    isGoogleProviderConfigured({
      GOOGLE_CLIENT_SECRET: "client-secret",
    }),
    false,
  );
});
