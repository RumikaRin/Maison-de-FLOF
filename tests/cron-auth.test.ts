import assert from "node:assert/strict";
import test from "node:test";
import { assertCronAuthorized } from "../src/lib/cron-auth.ts";

function mockRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return { headers } as unknown as Request;
}

test("cron auth fails closed when CRON_SECRET is missing", () => {
  const previous = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;

  const res = assertCronAuthorized(mockRequest("Bearer undefined"));
  assert.ok(res);
  assert.equal(res!.status, 503);

  if (previous === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = previous;
});

test("cron auth rejects wrong or missing bearer token", () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-cron-secret-value";

  assert.equal(assertCronAuthorized(mockRequest())!.status, 401);
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
