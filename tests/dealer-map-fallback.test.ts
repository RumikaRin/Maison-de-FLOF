import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mapcn-marker-tooltip checks WebGL support before map creation", async () => {
  const code = await readFile("src/components/ui/mapcn-marker-tooltip.tsx", "utf8");
  assert.ok(
    code.includes("isWebGLSupported") && code.includes("supported"),
    "Map component must check WebGL support to detect WebGL capability",
  );
});

test("mapcn-marker-tooltip wraps map initialization in try-catch to prevent unhandled WebGL crash", async () => {
  const code = await readFile("src/components/ui/mapcn-marker-tooltip.tsx", "utf8");
  assert.ok(
    /try\s*\{\s*[^}]*new\s+MapLibreGL\.Map/s.test(code),
    "Map component must wrap new MapLibreGL.Map in a try-catch block",
  );
});

test("mapcn-marker-tooltip renders graceful fallback UI when WebGL is unavailable", async () => {
  const code = await readFile("src/components/ui/mapcn-marker-tooltip.tsx", "utf8");
  assert.ok(
    code.includes("webgl") || code.includes("WebGL"),
    "Map component must inform user about WebGL / hardware acceleration requirement",
  );
  assert.ok(
    code.includes("MapPinOff"),
    "Map component must render fallback icon when WebGL is disabled",
  );
});
