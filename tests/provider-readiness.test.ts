import assert from "node:assert/strict";
import test from "node:test";
import {
  parseMailbox,
  verifyCloudinaryLifecycle,
  verifyResendAcceptance,
  verifyUpstashPing,
  createProviderFailureReport,
} from "../scripts/verify-provider-readiness.ts";

test("extracts a mailbox without exposing display-name syntax", () => {
  assert.equal(parseMailbox("FLOF <demo@example.com>"), "demo@example.com");
  assert.equal(parseMailbox("demo@example.com"), "demo@example.com");
});

test("verifies Upstash with a PONG response", async () => {
  const result = await verifyUpstashPing(async () =>
    new Response(JSON.stringify([{ result: "PONG" }]), { status: 200 }),
  );

  assert.deepEqual(result, { provider: "upstash", status: "PASS" });
});

test("rejects an invalid Upstash readiness response", async () => {
  await assert.rejects(
    verifyUpstashPing(async () =>
      new Response(JSON.stringify([{ result: "NOPE" }]), { status: 200 }),
    ),
    /invalid readiness response/,
  );
});

test("verifies Resend acceptance without retaining an address", async () => {
  const result = await verifyResendAcceptance(
    async () => ({ data: { id: "email-id" }, error: null }),
    "sender@example.com",
    "receiver@example.com",
  );

  assert.deepEqual(result, { provider: "resend", status: "PASS" });
  assert.equal(JSON.stringify(result).includes("receiver@example.com"), false);
});

test("rejects a Resend provider error", async () => {
  await assert.rejects(
    verifyResendAcceptance(
      async () => ({ data: null, error: { message: "provider detail" } }),
      "sender@example.com",
      "receiver@example.com",
    ),
    /did not accept/,
  );
});

test("uploads and deletes a disposable Cloudinary asset", async () => {
  const actions: string[] = [];
  const result = await verifyCloudinaryLifecycle({
    upload: async () => {
      actions.push("upload");
      return { public_id: "flof/readiness/p0" };
    },
    destroy: async () => {
      actions.push("destroy");
      return { result: "ok" };
    },
  });

  assert.deepEqual(actions, ["upload", "destroy"]);
  assert.deepEqual(result, { provider: "cloudinary", status: "PASS" });
});

test("deletes a disposable Cloudinary asset even when its identifier is invalid", async () => {
  const destroyed: string[] = [];

  await assert.rejects(
    verifyCloudinaryLifecycle({
      upload: async () => ({ public_id: "unexpected/p0" }),
      destroy: async (publicId) => {
        destroyed.push(publicId);
        return { result: "ok" };
      },
    }),
    /unexpected public identifier/,
  );
  assert.deepEqual(destroyed, ["unexpected/p0"]);
});

test("provider failure reports expose only allowlisted names and statuses", () => {
  const report = createProviderFailureReport(
    "https://user:password@example.com",
    {
      UPSTASH_REDIS_REST_URL: "https://user:password@example.com",
      RESEND_API_KEY: "re_secret",
      EMAIL_FROM: "private@example.com",
    },
  );
  assert.deepEqual(report, {
    provider: "unknown",
    status: "FAIL",
    code: "PROVIDER_READINESS_FAILED",
    missingVariables: [],
  });
  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("password"), false);
  assert.equal(serialized.includes("re_secret"), false);
  assert.equal(serialized.includes("private@example.com"), false);
});

test("provider failure reports list missing variable names without values", () => {
  assert.deepEqual(createProviderFailureReport("upstash", {}), {
    provider: "upstash",
    status: "FAIL",
    code: "PROVIDER_READINESS_FAILED",
    missingVariables: [
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ],
  });
});
