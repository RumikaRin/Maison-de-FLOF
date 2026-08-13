import assert from "node:assert/strict";
import test from "node:test";
import { getMobileSurfacePolicy } from "../src/lib/mobile-surface-policy.ts";

test("mobile surface policy strips locales and excludes conflicting fixed UI", () => {
  assert.deepEqual(getMobileSurfacePolicy("/vi/products"), {
    mode: "browse",
    bottomNavigation: true,
    contextualAction: "none",
    chat: true,
  });
  assert.deepEqual(getMobileSurfacePolicy("/en/products/majestic"), {
    mode: "product",
    bottomNavigation: false,
    contextualAction: "product-purchase",
    chat: false,
  });
  assert.deepEqual(getMobileSurfacePolicy("/vi/cart"), {
    mode: "transaction",
    bottomNavigation: false,
    contextualAction: "cart-checkout",
    chat: false,
  });
  assert.deepEqual(getMobileSurfacePolicy("/vi/checkout"), {
    mode: "transaction",
    bottomNavigation: false,
    contextualAction: "none",
    chat: false,
  });
  assert.deepEqual(getMobileSurfacePolicy("/vi/admin/orders"), {
    mode: "admin",
    bottomNavigation: false,
    contextualAction: "none",
    chat: false,
  });

  for (const path of ["/vi/blog/atelier-notes", "/en/blog/atelier-notes/"]) {
    assert.deepEqual(getMobileSurfacePolicy(path), {
      mode: "reading",
      bottomNavigation: false,
      contextualAction: "none",
      chat: true,
    });
  }

  for (const path of ["/checkout/success", "/vi/quote-request"]) {
    assert.deepEqual(getMobileSurfacePolicy(path), {
      mode: "transaction",
      bottomNavigation: false,
      contextualAction: "none",
      chat: false,
    });
  }

  for (const path of [
    "/profile",
    "/profile/orders",
    "/en/login",
    "/vi/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ]) {
    assert.deepEqual(getMobileSurfacePolicy(path), {
      mode: "account",
      bottomNavigation: false,
      contextualAction: "none",
      chat: false,
    });
  }

  for (const path of [
    "/vi/privacy-policy",
    "/en/cookie-policy/",
    "/terms-of-service",
  ]) {
    assert.deepEqual(getMobileSurfacePolicy(path), {
      mode: "reading",
      bottomNavigation: false,
      contextualAction: "none",
      chat: false,
    });
  }

  for (const path of [
    "/",
    "/vi/colors",
    "/en/color-visualizer",
    "/find-dealer",
    "/blog",
  ]) {
    assert.deepEqual(getMobileSurfacePolicy(path), {
      mode: "browse",
      bottomNavigation: true,
      contextualAction: "none",
      chat: true,
    });
  }
});
