import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { ADMIN_API_POLICIES } from "../src/lib/admin/admin-api-policy.ts";
import {
  hasPermission,
  type AppRole,
  type Permission,
} from "../src/lib/permissions.ts";

const HTTP_METHODS = ["GET", "POST", "PATCH", "DELETE"] as const;
const ADMIN_ROOT = path.resolve("src/app/api/admin");

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(absolute);
    return entry.name === "route.ts" ? [absolute] : [];
  });
}

function routeForFile(file: string) {
  const relative = path
    .relative(ADMIN_ROOT, path.dirname(file))
    .replaceAll("\\", "/");
  return `/api/admin${relative ? `/${relative}` : ""}`;
}

function exportedMethods(source: string) {
  return HTTP_METHODS.filter((method) =>
    new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`).test(source),
  );
}

function methodSource(source: string, method: string) {
  const start = source.search(
    new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`),
  );
  assert.notEqual(start, -1, `Missing source for ${method}`);
  const rest = source.slice(start + 1);
  const next = rest.search(/export\s+async\s+function\s+(GET|POST|PATCH|DELETE)\s*\(/);
  return next === -1 ? source.slice(start) : source.slice(start, start + 1 + next);
}

function key(route: string, method: string) {
  return `${method} ${route}`;
}

test("admin API policy manifest covers every exported route method exactly once", () => {
  const discovered = routeFiles(ADMIN_ROOT).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return exportedMethods(source).map((method) => key(routeForFile(file), method));
  });
  const declared = ADMIN_API_POLICIES.map((policy) =>
    key(policy.route, policy.method),
  );

  assert.deepEqual([...new Set(declared)].sort(), declared.slice().sort());
  assert.deepEqual(declared.slice().sort(), discovered.slice().sort());
});

test("admin API methods use the guard declared by their policy", () => {
  const sourceByRoute = new Map(
    routeFiles(ADMIN_ROOT).map((file) => [
      routeForFile(file),
      readFileSync(file, "utf8"),
    ]),
  );

  for (const policy of ADMIN_API_POLICIES) {
    const source = sourceByRoute.get(policy.route);
    assert.ok(source, `Missing route source for ${policy.route}`);
    const handler = methodSource(source, policy.method);
    const expected =
      policy.access.kind === "permission"
        ? `requirePermission("${policy.access.permission}")`
        : policy.access.minimum === "ADMIN"
          ? "requireAdmin("
          : "requireStaff(";
    assert.ok(
      handler.includes(expected),
      `${key(policy.route, policy.method)} must use ${expected}`,
    );
  }
});

test("every admin mutation has an explicit audit and verification decision", () => {
  for (const policy of ADMIN_API_POLICIES) {
    if (policy.mutation) {
      assert.notEqual(policy.audit, "not-required", key(policy.route, policy.method));
    }
    assert.ok(policy.verification.length > 0);
  }
});

test("role permission matrix keeps elevated admin capabilities away from staff", () => {
  const permissions: Permission[] = [
    "ORDER_READ",
    "ORDER_UPDATE",
    "PAYMENT_CONFIRM",
    "INVENTORY_IMPORT",
    "SUPPORT_MANAGE",
    "CATALOG_MANAGE",
    "PROMOTION_MANAGE",
    "COUPON_MANAGE",
    "MEDIA_DELETE",
    "USER_MANAGE",
  ];
  const staffExpected = new Set<Permission>([
    "ORDER_READ",
    "ORDER_UPDATE",
    "PAYMENT_CONFIRM",
    "INVENTORY_IMPORT",
    "SUPPORT_MANAGE",
  ]);
  const roles: AppRole[] = ["CUSTOMER", "STAFF", "ADMIN"];

  for (const role of roles) {
    for (const permission of permissions) {
      assert.equal(
        hasPermission(role, permission),
        role === "ADMIN" || (role === "STAFF" && staffExpected.has(permission)),
        `${role} ${permission}`,
      );
    }
  }

  for (const policy of ADMIN_API_POLICIES) {
    if (policy.access.kind === "permission") {
      assert.ok(permissions.includes(policy.access.permission));
    }
  }
});
