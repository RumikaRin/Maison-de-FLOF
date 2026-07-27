/**
 * Contract for the accounts the README tells people to sign in with.
 *
 * ADMIN and STAFF cannot sign in until their address is verified (see
 * `lib/auth/email-verification`). The seed originally created all three
 * documented accounts with `emailVerified` unset, so every credential in the
 * README was unusable. This pins the stamp — including on `update`, so that
 * re-running the seed repairs a database seeded before the fix.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  canSignInWithCredentials,
  requiresVerifiedEmailForLogin,
} from "../src/lib/auth/email-verification.ts";

const SEED = readFileSync(
  path.join(import.meta.dirname, "..", "prisma", "seed.ts"),
  "utf8",
);

const DOCUMENTED_ACCOUNTS = [
  "admin@sonvn.com",
  "staff@sonvn.com",
  "customer1@sonvn.com",
];

test("the seed stamps emailVerified on every documented account", () => {
  for (const email of DOCUMENTED_ACCOUNTS) {
    const index = SEED.indexOf(`"${email}"`);
    assert.ok(index > 0, `${email} is missing from the seed`);

    // The upsert block for this account: from its `where` clause to the end of
    // the `create` payload.
    const block = SEED.slice(index, index + 700);
    const created = block.match(/create:\s*\{([\s\S]*?)\n {4}\},/);
    assert.ok(created, `${email} has no create payload`);
    assert.match(
      created[1],
      /emailVerified:/,
      `${email} is created without emailVerified — it would not be able to sign in`,
    );

    const updated = block.match(/update:\s*\{([\s\S]*?)\}/);
    assert.ok(updated, `${email} has no update payload`);
    assert.match(
      updated[1],
      /emailVerified:/,
      `${email} does not backfill emailVerified on re-seed`,
    );
  }
});

test("privileged roles require a verified address, customers do not", () => {
  assert.equal(requiresVerifiedEmailForLogin("ADMIN"), true);
  assert.equal(requiresVerifiedEmailForLogin("STAFF"), true);
  assert.equal(requiresVerifiedEmailForLogin("CUSTOMER"), false);

  // A customer signs in straight after registering, before verifying.
  assert.equal(
    canSignInWithCredentials({ roleType: "CUSTOMER", emailVerified: null }),
    true,
  );
  // An unverified admin must not — an unverified address on an account that can
  // reach the admin surface is a takeover risk.
  assert.equal(
    canSignInWithCredentials({ roleType: "ADMIN", emailVerified: null }),
    false,
  );
  assert.equal(
    canSignInWithCredentials({ roleType: "ADMIN", emailVerified: new Date() }),
    true,
  );
});
