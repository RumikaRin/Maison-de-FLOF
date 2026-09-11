import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ColorExplorerSection adds data-lenis-prevent to allow unobstructed horizontal scrolling", async () => {
  const code = await readFile("src/components/features/home/ColorExplorerSection.tsx", "utf8");
  assert.ok(
    code.includes("data-lenis-prevent"),
    "Family selector container must have data-lenis-prevent to prevent Lenis scroll interception",
  );
});

test("ColorExplorerSection implements drag-to-scroll and wheel-to-horizontal for desktop mouse navigation", async () => {
  const code = await readFile("src/components/features/home/ColorExplorerSection.tsx", "utf8");
  assert.ok(
    code.includes("onMouseDown") && code.includes("onMouseMove"),
    "Family selector must implement mouse drag handlers (onMouseDown, onMouseMove)",
  );
  assert.ok(
    code.includes("cursor-grab"),
    "Family selector must provide cursor-grab visual affordance for draggable content",
  );
});
