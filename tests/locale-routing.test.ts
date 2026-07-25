import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LOCALE,
  isLocaleExcludedPath,
  localizedPath,
  resolveLocale,
  stripLocalePrefix,
  SUPPORTED_LOCALES,
} from "../src/lib/locale.ts";

test("locale helpers preserve an explicit supported prefix", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["vi", "en"]);
  assert.equal(DEFAULT_LOCALE, "vi");
  assert.deepEqual(stripLocalePrefix("/en/products/red"), {
    locale: "en",
    pathname: "/products/red",
    hadPrefix: true,
  });
  assert.equal(localizedPath("/vi/products/red", "en"), "/en/products/red");
  assert.equal(localizedPath("/", "vi"), "/vi");
});

test("locale resolution prefers URL then cookie then Vietnamese default", () => {
  assert.equal(resolveLocale({ pathname: "/en/blog", cookie: "vi" }), "en");
  assert.equal(resolveLocale({ pathname: "/products", cookie: "en" }), "en");
  assert.equal(resolveLocale({ pathname: "/products", cookie: "fr" }), "vi");
});

test("API, auth callbacks, metadata and static assets are never localized", () => {
  for (const pathname of [
    "/api/products",
    "/api/auth/callback/google",
    "/_next/static/app.js",
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
    "/images/room.webp",
  ]) {
    assert.equal(isLocaleExcludedPath(pathname), true, pathname);
    assert.equal(localizedPath(pathname, "en"), pathname, pathname);
  }
  assert.equal(isLocaleExcludedPath("/products"), false);
});
