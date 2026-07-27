/**
 * Explains why a given account cannot sign in, against the database in
 * `DATABASE_URL`. Read-only.
 *
 *   npm run check:account -- admin@sonvn.com
 *   npm run check:account -- admin@sonvn.com admin123
 *   npm run check:account -- admin@sonvn.com --fix
 *
 * Pass the password to also verify the bcrypt hash. The UI shows one generic
 * message on failure so it cannot be used to enumerate accounts, so this is the
 * intended way for an operator to see the real reason locally.
 *
 * `--fix` stamps `emailVerified` on that one account. It exists so an operator
 * can repair a single login without re-seeding an entire catalogue; it grants
 * nothing that direct `UPDATE` on the same database would not.
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import {
  canSignInWithCredentials,
  requiresVerifiedEmailForLogin,
} from "../src/lib/auth/email-verification.ts";

const argv = process.argv.slice(2);
const shouldFix = argv.includes("--fix");
const [emailArgument, passwordArgument] = argv.filter((value) => value !== "--fix");

if (!emailArgument) {
  console.error("Usage: npm run check:account -- <email> [password]");
  process.exit(1);
}

const email = emailArgument.trim().toLowerCase();
const db = new PrismaClient();

try {
  const user = await db.user.findUnique({
    where: { email },
    include: { role: true, mfaCredential: { select: { enabledAt: true } } },
  });

  if (!user) {
    console.log(`✗ ${email} does not exist in this database.`);
    console.log("  Run `npm run db:seed` if you expected a seeded account.");
    process.exit(1);
  }

  const role = user.role.type;
  const verified = user.emailVerified !== null;
  const mfaEnabled = Boolean(user.mfaCredential?.enabledAt);

  console.log(`account   ${email}`);
  console.log(`role      ${role}`);
  console.log(`password  ${user.password ? "set" : "MISSING (OAuth-only account)"}`);
  console.log(`verified  ${verified ? "yes" : "no"}`);
  console.log(`mfa       ${mfaEnabled ? "enabled — a code is required" : "not enrolled"}`);
  console.log("");

  const blockers: string[] = [];

  if (!user.password) {
    blockers.push("No password credential — this account can only use Google sign-in.");
  }

  if (!canSignInWithCredentials({ roleType: role, emailVerified: user.emailVerified })) {
    blockers.push(
      `${role} requires a verified email address and this one is unverified. ` +
        "Fix with `npm run db:seed` for seeded accounts, or verify from Profile → Email verification.",
    );
  } else if (!verified && requiresVerifiedEmailForLogin(role) === false) {
    console.log("note      unverified, but customers may sign in unverified — not a blocker.");
  }

  if (passwordArgument) {
    if (!user.password) {
      blockers.push("Cannot check the password: no hash stored.");
    } else if (!(await bcrypt.compare(passwordArgument, user.password))) {
      blockers.push("The supplied password does not match the stored hash.");
    } else {
      console.log("note      supplied password matches the stored hash.");
    }
  } else {
    console.log("note      password not checked — pass it as the second argument to verify.");
  }

  if (mfaEnabled && role === "ADMIN") {
    console.log("note      MFA is enrolled, so a valid TOTP or recovery code is also required.");
  }

  if (shouldFix && !verified) {
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    console.log("");
    console.log(`✓ --fix: stamped emailVerified on ${email}.`);
    console.log("  Re-run without --fix to confirm, then sign in.");
    process.exit(0);
  }

  console.log("");
  if (blockers.length === 0) {
    console.log("✓ Nothing in the database blocks this sign-in.");
    console.log(
      "  If it still fails on a production build, the rate limiter is fail-closed:\n" +
        "  without UPSTASH_REDIS_REST_URL / _TOKEN every login returns 503. Use `npm run dev`.",
    );
  } else {
    console.log(`✗ ${blockers.length} blocker(s):`);
    for (const blocker of blockers) console.log(`  - ${blocker}`);
    process.exitCode = 1;
  }
} finally {
  await db.$disconnect();
}
