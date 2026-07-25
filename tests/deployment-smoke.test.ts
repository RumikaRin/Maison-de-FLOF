import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateSecurityHeaders,
  expectedSmokeRoutes,
  runDeploymentSmoke,
} from "../scripts/check-deployment-smoke.ts";

test("covers public, metadata, API, admin, and cron paths", () => {
  assert.deepEqual(expectedSmokeRoutes, [
    "/",
    "/products",
    "/colors",
    "/blog",
    "/find-dealer",
    "/robots.txt",
    "/sitemap.xml",
    "/api/products?limit=1",
    "/admin",
    "/api/cron/process-outbox",
    "/api/cron/apply-retention",
  ]);
});

test("accepts the required production security headers", () => {
  const headers = new Headers({
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "content-security-policy":
      "default-src 'self'; script-src 'self' 'nonce-value'; object-src 'none'",
  });

  assert.deepEqual(evaluateSecurityHeaders(headers), []);
});

test("rejects missing headers and unsafe production script policy", () => {
  const headers = new Headers({
    "content-security-policy":
      "default-src 'self'; script-src 'self' 'unsafe-eval'",
  });

  assert.deepEqual(evaluateSecurityHeaders(headers), [
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "content-security-policy:unsafe-eval",
  ]);
});

test("accepts expected production statuses without following the admin redirect", async () => {
  const request = async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.pathname === "/admin") {
      return new Response(null, {
        status: 307,
        headers: { location: "/login" },
      });
    }
    if (url.pathname.startsWith("/api/cron/")) {
      return new Response(null, { status: 401 });
    }
    const headers =
      url.pathname === "/"
        ? {
            "strict-transport-security": "max-age=63072000",
            "x-content-type-options": "nosniff",
            "x-frame-options": "SAMEORIGIN",
            "content-security-policy":
              "default-src 'self'; script-src 'self' 'nonce-value'",
          }
        : undefined;
    return new Response(null, { status: 200, headers });
  };

  const results = await runDeploymentSmoke("https://example.com", request);

  assert.equal(results.length, expectedSmokeRoutes.length);
  assert.equal(results.every((result) => result.passed), true);
});

test("reports an unexpected cron status without exposing response content", async () => {
  const request = async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.pathname.startsWith("/api/cron/")) {
      return new Response("internal provider detail", { status: 503 });
    }
    if (url.pathname === "/admin") {
      return new Response(null, {
        status: 307,
        headers: { location: "/login" },
      });
    }
    return new Response(null, {
      status: 200,
      headers:
        url.pathname === "/"
          ? {
              "strict-transport-security": "max-age=63072000",
              "x-content-type-options": "nosniff",
              "x-frame-options": "SAMEORIGIN",
              "content-security-policy":
                "default-src 'self'; script-src 'self' 'nonce-value'",
            }
          : undefined,
    });
  };

  const results = await runDeploymentSmoke("https://example.com", request);
  const cron = results.find(
    (result) => result.route === "/api/cron/process-outbox",
  );

  assert.deepEqual(cron, {
    route: "/api/cron/process-outbox",
    status: 503,
    passed: false,
    failures: ["status:503"],
  });
  assert.equal(JSON.stringify(results).includes("provider detail"), false);
});
