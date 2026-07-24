import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { isMainModule } from "./is-main-module.ts";

export const CRITICAL_API_OPERATIONS = {
  "/api/auth/register": ["post"],
  "/api/auth/forgot-password": ["post"],
  "/api/products": ["get"],
  "/api/colors": ["get"],
  "/api/coupons/validate": ["post"],
  "/api/orders": ["get", "post"],
  "/api/orders/{orderNumber}": ["get", "patch"],
  "/api/profile": ["get", "patch"],
  "/api/quote-request": ["post"],
} as const;

const CRITICAL_API_ROUTE_FILES: Record<
  keyof typeof CRITICAL_API_OPERATIONS,
  string
> = {
  "/api/auth/register": "src/app/api/auth/register/route.ts",
  "/api/auth/forgot-password": "src/app/api/auth/forgot-password/route.ts",
  "/api/products": "src/app/api/products/route.ts",
  "/api/colors": "src/app/api/colors/route.ts",
  "/api/coupons/validate": "src/app/api/coupons/validate/route.ts",
  "/api/orders": "src/app/api/orders/route.ts",
  "/api/orders/{orderNumber}": "src/app/api/orders/[orderNumber]/route.ts",
  "/api/profile": "src/app/api/profile/route.ts",
  "/api/quote-request": "src/app/api/quote-request/route.ts",
};

export async function validateOpenApiCoverage(
  openApiPath = "docs/openapi.yaml",
) {
  const document = parse(await readFile(openApiPath, "utf8")) as {
    openapi?: string;
    paths?: Record<string, Record<string, unknown>>;
    components?: { schemas?: Record<string, unknown> };
  };

  for (const [path, methods] of Object.entries(CRITICAL_API_OPERATIONS)) {
    assert.ok(document.paths?.[path], `OpenAPI path missing: ${path}`);
    const routeSource = await readFile(
      CRITICAL_API_ROUTE_FILES[path as keyof typeof CRITICAL_API_OPERATIONS],
      "utf8",
    );
    for (const method of methods) {
      assert.ok(
        document.paths?.[path]?.[method],
        `OpenAPI operation missing: ${method.toUpperCase()} ${path}`,
      );
      assert.match(
        routeSource,
        new RegExp(`export async function ${method.toUpperCase()}\\b`),
        `Route source missing: ${method.toUpperCase()} ${path}`,
      );
    }
  }

  for (const schema of ["ApiError", "Pagination", "Product", "Order"]) {
    assert.ok(
      document.components?.schemas?.[schema],
      `OpenAPI schema missing: ${schema}`,
    );
  }

  return document;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  await validateOpenApiCoverage();
  console.log("Critical OpenAPI coverage validated");
}
