import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Header mobile menu toggle button has fixed equal width to prevent layout shift", async () => {
  const header = await readFile("src/components/layout/Header.tsx", "utf8");
  // The trigger button must have a stable width (w-[7.75rem] / 124px) so toggling between "DANH MỤC" and "ĐÓNG" never shifts
  assert.ok(
    header.includes("w-[7.75rem]") || header.includes("w-[124px]"),
    "Mobile menu toggle button must define a fixed width (e.g. w-[7.75rem]) to equalize 'DANH MỤC' and 'ĐÓNG'",
  );
  assert.ok(
    header.includes("shrink-0"),
    "Icon container must have shrink-0 to prevent icon jitter",
  );
});
