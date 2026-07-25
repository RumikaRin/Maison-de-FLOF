import assert from "node:assert/strict";
import test from "node:test";
import {
  createApiErrorResponse,
  getApiErrorMessage,
  getApiRequestId,
} from "../src/lib/api-error-contract.ts";

test("creates a stable error envelope with a request identifier", async () => {
  const response = createApiErrorResponse(
    { status: 403, code: "FORBIDDEN", message: "Forbidden" },
    "request-123",
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: {
      code: "FORBIDDEN",
      message: "Forbidden",
    },
    requestId: "request-123",
  });
});

test("prefers Vercel correlation IDs and otherwise generates an identifier", () => {
  const request = new Request("https://flof.test/api/products", {
    headers: { "x-vercel-id": "sin1::request-123" },
  });

  assert.equal(getApiRequestId(request), "sin1::request-123");
  assert.ok(getApiRequestId().length > 0);
});

test("reads both structured and legacy API error payloads", () => {
  assert.equal(
    getApiErrorMessage({ error: { message: "Forbidden" } }),
    "Forbidden",
  );
  assert.equal(getApiErrorMessage({ error: "Legacy error" }), "Legacy error");
  assert.equal(getApiErrorMessage(null, "Fallback"), "Fallback");
});
