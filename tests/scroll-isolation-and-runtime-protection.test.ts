import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Map component in mapcn-marker-tooltip isolates wheel scrolling from outer page", async () => {
  const code = await readFile("src/components/ui/mapcn-marker-tooltip.tsx", "utf8");
  assert.ok(
    code.includes("data-lenis-prevent"),
    "Map component must have data-lenis-prevent to prevent smooth scroll hijacking",
  );
  assert.ok(
    code.includes("stopPropagation") && code.includes("wheel"),
    "Map component must stop wheel event propagation to prevent scrolling the website while zooming",
  );
  assert.ok(
    code.includes("overscroll-contain"),
    "Map component container must have overscroll-contain to avoid browser scroll chaining",
  );
});

test("Find-dealer list container isolates scrolling with data-lenis-prevent and overscroll-contain", async () => {
  const code = await readFile("src/app/find-dealer/page.tsx", "utf8");
  assert.ok(
    code.includes("data-lenis-prevent"),
    "Dealer list container in find-dealer must have data-lenis-prevent",
  );
  assert.ok(
    code.includes("overscroll-contain"),
    "Dealer list container in find-dealer must have overscroll-contain",
  );
});

test("Admin layout sidebar isolates scrolling and is not blocked by Lenis", async () => {
  const code = await readFile("src/app/admin/layout.tsx", "utf8");
  assert.ok(
    code.includes("data-lenis-prevent"),
    "Admin sidebar in layout.tsx must have data-lenis-prevent attribute",
  );
  assert.ok(
    code.includes("overscroll-contain"),
    "Admin sidebar nav must have overscroll-contain class",
  );
});

test("SmoothScrollProvider completely disables Lenis on admin routes", async () => {
  const code = await readFile("src/providers/smooth-scroll-provider.tsx", "utf8");
  assert.ok(
    code.includes("/admin"),
    "SmoothScrollProvider must check for /admin route to disable Lenis",
  );
  assert.ok(
    code.includes("destroy"),
    "SmoothScrollProvider must destroy Lenis instance when navigating to admin",
  );
});

test("Root layout traps and suppresses browser extension errors (e.g. Urban VPN M_ID error)", async () => {
  const code = await readFile("src/app/layout.tsx", "utf8");
  assert.ok(
    code.includes("chrome-extension://") || code.includes("M_ID"),
    "Root layout must contain protection against browser extension runtime errors",
  );
  assert.ok(
    code.includes("stopImmediatePropagation"),
    "Extension error handler must stopImmediatePropagation in capture phase",
  );
});
