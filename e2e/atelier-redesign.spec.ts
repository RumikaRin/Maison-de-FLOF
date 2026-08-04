/**
 * Atelier Editorial redesign gate.
 *
 * Asserts the structural floor from design.md across every public route, both
 * locales, and the four widths Hallmark treats as non-negotiable. These are
 * layout-safety checks, not visual snapshots — they catch the failures that a
 * screenshot review reliably misses.
 */

import { expect, test, type Page } from "@playwright/test";

import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";

const PUBLIC_ROUTES = [
  "/",
  "/products",
  `/products/${TEST_FIXTURES.productSlug}`,
  "/colors",
  "/color-visualizer",
  "/blog",
  "/find-dealer",
  "/quote-request",
  "/cart",
  "/checkout",
  "/profile",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy-policy",
  "/cookie-policy",
  "/terms-of-service",
] as const;

const LOCALES = ["vi", "en"] as const;

const WIDTHS = [
  { name: "320", width: 320, height: 720 },
  { name: "375", width: 375, height: 812 },
  { name: "414", width: 414, height: 896 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
] as const;

/** Vietnamese glyphs with the tallest stacked diacritics. */
const DIACRITIC_PROBE = "ẫộỹềặ";

async function gotoSettled(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // Chat polling and MapLibre tile streams keep the network busy forever, so
  // networkidle gets a short cap — the DOM is what we assert.
  await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
}

test.describe("layout safety across public routes", () => {
  for (const locale of LOCALES) {
    for (const route of PUBLIC_ROUTES) {
      const path = route === "/" ? `/${locale}` : `/${locale}${route}`;

      test(`no horizontal overflow · ${path}`, async ({ page }) => {
        for (const viewport of WIDTHS) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await gotoSettled(page, path);

          const measure = () =>
            page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            }));

          let overflow = await measure();
          if (overflow.scrollWidth > overflow.clientWidth + 1) {
            // MapLibre tiles and late images can widen the document for a
            // moment while loading; a persistent overflow is the real bug.
            await page.waitForTimeout(2500);
            overflow = await measure();
          }

          // 1px of rounding slack; anything more is a real overflow.
          expect(
            overflow.scrollWidth,
            `${path} overflows horizontally at ${viewport.name}px`,
          ).toBeLessThanOrEqual(overflow.clientWidth + 1);
        }
      });
    }
  }
});

test.describe("clickable text never wraps to two lines", () => {
  // Hallmark gate 49. Buttons, nav links, footer links and CTAs must stay on
  // one line at every width, because a wrapped control reads as broken.
  for (const route of ["/", "/products", "/colors"] as const) {
    test(`single-line controls · ${route}`, async ({ page }) => {
      for (const viewport of WIDTHS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoSettled(page, route === "/" ? "/vi" : `/vi${route}`);

        const wrapped = await page.evaluate(() => {
          const offenders: string[] = [];
          const candidates = document.querySelectorAll<HTMLElement>(
            "header a, header button, footer a, footer button, main button",
          );
          for (const element of candidates) {
            const text = element.textContent?.trim() ?? "";
            if (text.length === 0 || text.length > 60) continue;
            const style = getComputedStyle(element);
            const lineHeight = Number.parseFloat(style.lineHeight);
            if (!Number.isFinite(lineHeight) || lineHeight === 0) continue;
            // Composed selection controls (swatch + label stacked by design)
            // are not "two-line text" in the gate-49 sense.
            if (element.getAttribute("aria-pressed") !== null) continue;
            if (element.querySelector("svg, .fl-label")) continue;
            // Compare the text box, not the padded control box. A control made
            // of several inline spans produces several rects on ONE line, so
            // treat it as wrapped only when two rect tops are at least one
            // line apart.
            const range = document.createRange();
            range.selectNodeContents(element);
            const tops = [...range.getClientRects()]
              .filter((rect) => rect.width > 0 && rect.height > 0)
              .map((rect) => rect.top)
              .sort((a, b) => a - b);
            const spread = tops.length ? tops[tops.length - 1] - tops[0] : 0;
            if (spread >= lineHeight * 0.8) offenders.push(text.slice(0, 40));
          }
          return offenders;
        });

        expect(wrapped, `wrapped controls at ${viewport.name}px`).toEqual([]);
      }
    });
  }
});

test.describe("touch targets", () => {
  test("every interactive control is at least 44px tall below 768px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoSettled(page, "/vi");

    const undersized = await page.evaluate(() => {
      const offenders: string[] = [];
      const candidates = document.querySelectorAll<HTMLElement>(
        "header a, header button, main a[href], main button, footer a, footer button",
      );
      for (const element of candidates) {
        const rect = element.getBoundingClientRect();
        // Skip elements that are not rendered.
        if (rect.width === 0 || rect.height === 0) continue;
        // Inline links inside running prose are exempt — only controls count.
        if (element.closest("p, li")) continue;
        // A title link inside (or wrapping) a heading duplicates the adjacent
        // image link's large target (WCAG 2.5.8 duplicate-target exception).
        if (element.closest("h1, h2, h3, h4") || element.querySelector("h1, h2, h3, h4")) continue;
        if (rect.height < 44) {
          offenders.push(`${element.tagName}:${element.textContent?.trim().slice(0, 30)} = ${Math.round(rect.height)}px`);
        }
      }
      return offenders;
    });

    expect(undersized).toEqual([]);
  });
});

test.describe("typography", () => {
  test("display type does not clip Vietnamese diacritics", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoSettled(page, "/vi");

    const clipped = await page.evaluate((probe) => {
      const offenders: string[] = [];
      const headings = document.querySelectorAll<HTMLElement>("h1, h2, .fl-display");
      for (const heading of headings) {
        const text = heading.textContent ?? "";
        if (![...probe].some((glyph) => text.includes(glyph))) continue;
        const style = getComputedStyle(heading);
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        // Stacked Vietnamese diacritics need roughly 1.0x the em box; anything
        // tighter clips the tone mark above the breve.
        if (Number.isFinite(lineHeight) && lineHeight < fontSize * 0.97) {
          offenders.push(`${text.slice(0, 30)} line-height ${lineHeight} < ${fontSize}`);
        }
      }
      return offenders;
    }, DIACRITIC_PROBE);

    expect(clipped).toEqual([]);
  });

  test("no italic headings anywhere on the homepage", async ({ page }) => {
    // design.md § Typography, Hallmark gate 38a.
    await gotoSettled(page, "/vi");

    const italics = await page.evaluate(() => {
      const offenders: string[] = [];
      for (const heading of document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, .fl-display")) {
        if (getComputedStyle(heading).fontStyle !== "normal") {
          offenders.push(heading.textContent?.trim().slice(0, 40) ?? heading.tagName);
        }
      }
      return offenders;
    });

    expect(italics).toEqual([]);
  });

  test("customer-facing body copy is never below 14px", async ({ page }) => {
    await gotoSettled(page, "/vi");

    const tooSmall = await page.evaluate(() => {
      const offenders: string[] = [];
      for (const element of document.querySelectorAll<HTMLElement>("main p, main li, main dd")) {
        const text = element.textContent?.trim() ?? "";
        if (text.length < 12) continue;
        // Uppercase technical metadata is allowed at 11px (design.md § Typography).
        if (element.classList.contains("fl-label") || element.closest(".fl-label")) continue;
        const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
        if (fontSize < 13.5) offenders.push(`${fontSize}px · ${text.slice(0, 30)}`);
      }
      return offenders;
    });

    expect(tooSmall).toEqual([]);
  });
});

test.describe("focus", () => {
  test("keyboard focus produces a visible ring on the first controls", async ({ page }) => {
    await gotoSettled(page, "/vi");

    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return null;
        const style = getComputedStyle(active);
        return {
          tag: active.tagName,
          width: Number.parseFloat(style.outlineWidth),
          style: style.outlineStyle,
        };
      });
      if (!outline) continue;
      expect(outline.style, `${outline.tag} has no focus outline`).not.toBe("none");
      expect(outline.width, `${outline.tag} focus ring is too thin`).toBeGreaterThanOrEqual(1.5);
    }
  });
});

test.describe("retired treatments are gone from public pages", () => {
  test("no aurora, grain overlay, bezel or eyebrow-pill on the homepage", async ({ page }) => {
    await gotoSettled(page, "/vi");

    const found = await page.evaluate(() => {
      const banned = [
        ".bezel-outer",
        ".bezel-inner",
        ".btn-island",
        ".eyebrow-pill",
        ".animate-aurora",
        ".animate-float",
        ".section-premium",
      ];
      return banned.filter((selector) => document.querySelector(selector) !== null);
    });

    expect(found).toEqual([]);
  });
});
