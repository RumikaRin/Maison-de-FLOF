import { expect, test } from "@playwright/test";

const publicCatalogRoutes = ["/", "/products"] as const;

for (const route of publicCatalogRoutes) {
  test(`${route} stays below the good CLS threshold after hydration`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const layoutState = window as typeof window & { __flofCls?: number };
      layoutState.__flofCls = 0;

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!shift.hadRecentInput) {
            layoutState.__flofCls = (layoutState.__flofCls ?? 0) + shift.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const cumulativeLayoutShift = await page.evaluate(
      () => (window as typeof window & { __flofCls?: number }).__flofCls ?? 0,
    );

    expect(cumulativeLayoutShift).toBeLessThanOrEqual(0.1);
  });
}
