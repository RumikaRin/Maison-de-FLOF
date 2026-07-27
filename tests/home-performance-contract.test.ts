import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage streams the hero before catalogue data", async () => {
  const [pageSource, homeClientSource] = await Promise.all([
    readSource("src/app/page.tsx"),
    readSource("src/components/features/home/HomeClient.tsx"),
  ]);

  assert.ok(pageSource.includes("<HeroSection />"));
  assert.ok(pageSource.includes("<Suspense"));
  assert.ok(
    pageSource.indexOf("<HeroSection />") < pageSource.indexOf("<Suspense"),
  );
  assert.ok(!homeClientSource.includes("<HeroSection />"));
});

test("homepage LCP image has no first-paint opacity gate", async () => {
  const [heroSource, layoutSource] = await Promise.all([
    readSource("src/components/features/home/HeroSection.tsx"),
    readSource("src/components/layout/MainLayoutWrapper.tsx"),
  ]);

  assert.ok(
    !heroSource.includes(
      "initial={reduceMotion ? false : { opacity: 0 }}",
    ),
  );
  assert.ok(heroSource.includes("quality={82}"));
  assert.ok(!layoutSource.includes("<safeMotion.main"));
});
