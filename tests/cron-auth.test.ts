import assert from "node:assert/strict";
import test from "node:test";
import { assertCronAuthorized } from "../src/lib/cron-auth.ts";

function mockRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return { headers } as unknown as Request;
}

test("cron auth fails closed with the stable API error envelope", async () => {
  const previous = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;

  const res = assertCronAuthorized(mockRequest("Bearer undefined"));
  assert.ok(res);
  assert.equal(res!.status, 503);
  const payload = await res!.json();
  assert.deepEqual(payload.error, {
    code: "INTERNAL_ERROR",
    message: "Cron endpoint is not configured",
  });
  assert.equal(typeof payload.requestId, "string");

  if (previous === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = previous;
});

test("cron auth rejects wrong or missing bearer token", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-cron-secret-value";

  const missing = assertCronAuthorized(mockRequest())!;
  assert.equal(missing.status, 401);
  assert.deepEqual((await missing.json()).error, {
    code: "UNAUTHORIZED",
    message: "Unauthorized",
  });
  assert.equal(assertCronAuthorized(mockRequest("Bearer wrong"))!.status, 401);
  assert.equal(assertCronAuthorized(mockRequest("Bearer test-cron-secret-value")), null);

  if (previous === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = previous;
});

test("cron auth never accepts literal Bearer undefined as valid", () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "real-secret";

  const res = assertCronAuthorized(mockRequest("Bearer undefined"));
  assert.ok(res);
  assert.equal(res!.status, 401);

  if (previous === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = previous;
});
