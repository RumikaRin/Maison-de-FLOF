import assert from "node:assert/strict";
import test from "node:test";
import { shouldEnableVercelTelemetry } from "../src/lib/vercel-runtime.ts";

test("Vercel telemetry is enabled only inside a Vercel deployment", () => {
  assert.equal(shouldEnableVercelTelemetry({ VERCEL: "1" }), true);
  assert.equal(shouldEnableVercelTelemetry({ VERCEL: "0" }), false);
  assert.equal(shouldEnableVercelTelemetry({}), false);
});
