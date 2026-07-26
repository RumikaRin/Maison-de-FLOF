import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("profile API exposes MFA state without exposing credential material", async () => {
  const source = await readFile("src/app/api/profile/route.ts", "utf8");

  assert.match(source, /mfaCredential:\s*\{\s*select:\s*\{\s*enabledAt:\s*true/);
  assert.match(source, /mfaEnabled:/);
  assert.doesNotMatch(source, /encryptedSecret:\s*true/);
  assert.doesNotMatch(source, /recoveryCodeHashes:\s*true/);
});

test("administrator security UI uses the existing MFA lifecycle endpoints", async () => {
  const source = await readFile(
    "src/components/features/profile/tabs/SecurityTab.tsx",
    "utf8",
  );

  assert.match(source, /\/api\/profile\/mfa\/setup/);
  assert.match(source, /\/api\/profile\/mfa\/verify/);
  assert.match(source, /\/api\/profile\/mfa\/disable/);
  assert.match(source, /recoveryCodes/);
  assert.match(source, /download/);
});

test("security navigation remains administrator-only", async () => {
  const source = await readFile(
    "src/components/features/profile/ProfileSidebar.tsx",
    "utf8",
  );

  assert.match(
    source,
    /user\.role === "ADMIN"[\s\S]*setActiveTab\("security"\)/,
  );
});
