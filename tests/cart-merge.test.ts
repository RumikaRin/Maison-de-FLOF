/**
 * Cart-merge logic — the core of multi-device sync. Pure, no `@/` imports, so it
 * runs under `node --test` without the path-alias loader.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeCarts,
  normalizeCart,
  reconcileMergedCart,
  MAX_LINE_QUANTITY,
} from "../src/lib/cart-merge.ts";

test("normalize coalesces duplicate (paint, colour) lines by summing quantity", () => {
  const result = normalizeCart([
    { paintId: "p1", colorCode: "1001", quantity: 2 },
    { paintId: "p1", colorCode: "1001", quantity: 3 },
    { paintId: "p1", colorCode: "", quantity: 1 },
  ]);
  assert.equal(result.length, 2);
  const withColor = result.find((l) => l.colorCode === "1001");
  assert.equal(withColor?.quantity, 5);
});

test("normalize drops zero/negative lines and clamps to the ceiling", () => {
  const result = normalizeCart([
    { paintId: "p1", colorCode: "", quantity: 0 },
    { paintId: "p2", colorCode: "", quantity: -4 },
    { paintId: "p3", colorCode: "", quantity: 500 },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].paintId, "p3");
  assert.equal(result[0].quantity, MAX_LINE_QUANTITY);
});

test("merge is the union of both carts — logging in never drops items", () => {
  const server = [
    { paintId: "p1", colorCode: "1001", quantity: 1 },
    { paintId: "p2", colorCode: "", quantity: 2 },
  ];
  const local = [
    { paintId: "p1", colorCode: "1001", quantity: 3 }, // same line → sums
    { paintId: "p3", colorCode: "2002", quantity: 1 }, // new line → kept
  ];
  const merged = mergeCarts(server, local);

  const byKey = new Map(merged.map((l) => [`${l.paintId}-${l.colorCode}`, l.quantity]));
  assert.equal(byKey.get("p1-1001"), 4, "same paint+colour sums");
  assert.equal(byKey.get("p2-"), 2, "server-only line survives");
  assert.equal(byKey.get("p3-2002"), 1, "local-only line survives");
  assert.equal(merged.length, 3);
});

test("merge treats a different colour as a distinct line", () => {
  const merged = mergeCarts(
    [{ paintId: "p1", colorCode: "1001", quantity: 1 }],
    [{ paintId: "p1", colorCode: "2002", quantity: 1 }],
  );
  assert.equal(merged.length, 2);
});

/* --- reconcileMergedCart — the login-merge in-flight race ---------------- */

const keyed = (key: string, quantity: number) => ({ key, quantity, item: key });

test("an item added while the merge was in flight survives adoption", () => {
  // Request went out with an empty cart; server replied empty; meanwhile the
  // user hit "Mua ngay". Blind adoption would wipe the item.
  const result = reconcileMergedCart([], [], [keyed("p1-", 1)]);
  assert.equal(result.length, 1);
  assert.equal(result[0].key, "p1-");
  assert.equal(result[0].quantity, 1);
});

test("a removal while in flight is applied on top of the server result", () => {
  const server = [keyed("p1-", 3), keyed("p2-", 2)];
  const atRequest = [keyed("p1-", 2), keyed("p2-", 2)];
  const current = [keyed("p2-", 2)]; // user removed p1 mid-flight
  const result = reconcileMergedCart(server, atRequest, current);
  const byKey = new Map(result.map((l) => [l.key, l.quantity]));
  // Server had 3 (2 from this request + 1 from another device); local delta -2.
  assert.equal(byKey.get("p1-"), 1);
  assert.equal(byKey.get("p2-"), 2);
});

test("no in-flight change means the server result is adopted verbatim", () => {
  const server = [keyed("p1-", 5)];
  const same = [keyed("p1-", 2)];
  const result = reconcileMergedCart(server, same, same);
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 5);
});
