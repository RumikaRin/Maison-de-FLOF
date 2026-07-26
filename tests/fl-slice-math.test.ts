import assert from "node:assert/strict";
import test from "node:test";
import { clampVelocity, decayVelocity } from "../src/lib/fl-slice";

test("clampVelocity maps pixel deltas into [-1, 1]", () => {
  assert.equal(clampVelocity(0), 0);
  assert.equal(clampVelocity(60), 1);
  assert.equal(clampVelocity(-600), -1);
  assert.ok(Math.abs(clampVelocity(30) - 0.5) < 1e-9);
});

test("decayVelocity lerps toward target and snaps to zero below epsilon", () => {
  const v1 = decayVelocity(0, 1);
  assert.ok(v1 > 0 && v1 < 1);
  assert.equal(decayVelocity(0.0005, 0), 0);
  let v = 1;
  for (let i = 0; i < 200; i++) v = decayVelocity(v, 0);
  assert.equal(v, 0);
});
