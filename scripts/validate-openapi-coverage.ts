import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { discoverApiOperations, type ApiOperation } from "./api-route-inventory.ts";
import { isMainModule } from "./is-main-module.ts";

const HTTP_METHODS = new Set(["get", "post", "patch", "delete"]);

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  security?: Array<Record<string, unknown>>;
  responses?: Record<string, unknown>;
};

type OpenApiDocument = {
  openapi?: string;
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
};

function operationKey(operation: Pick<ApiOperation, "path" | "method">) {
  return `${operation.method.toUpperCase()} ${operation.path}`;
}

function documentedApiOperations(document: OpenApiDocument) {
  return Object.entries(document.paths ?? {}).flatMap(([apiPath, item]) =>
    Object.entries(item)
      .filter(([method]) => HTTP_METHODS.has(method))
      .map(([method, operation]) => ({
        path: apiPath,
        method: method as ApiOperation["method"],
        operation: operation as OpenApiOperation,
      })),
  );
}

function requiresSession(pathname: string, method: ApiOperation["method"]) {
  if (pathname.startsWith("/api/admin/")) return true;
  if (pathname === "/api/admin") return true;
  if (pathname.startsWith("/api/profile")) return true;
  if (pathname === "/api/orders") return true;
  if (pathname === "/api/orders/{orderNumber}") return true;
  if (pathname === "/api/reviews" && method === "post") return true;
  return pathname === "/api/chat/conversation";
}

function hasSessionCookie(operation: OpenApiOperation) {
  return Boolean(
    operation.security?.some((requirement) =>
      Object.prototype.hasOwnProperty.call(requirement, "sessionCookie"),
    ),
  );
}

export async function validateOpenApiCoverage(
  openApiPath = "docs/openapi.yaml",
) {
  const document = parse(await readFile(openApiPath, "utf8")) as OpenApiDocument;
  const sourceOperations = await discoverApiOperations();
  const documentedOperations = documentedApiOperations(document);

  const sourceKeys = new Set(sourceOperations.map(operationKey));
  const documentedKeys = new Set(documentedOperations.map(operationKey));
  const missing = [...sourceKeys].filter((key) => !documentedKeys.has(key)).sort();
  const stale = [...documentedKeys].filter((key) => !sourceKeys.has(key)).sort();
  assert.deepEqual(
    missing,
    [],
    `OpenAPI missing source operations: ${missing.join(", ")}`,
  );
  assert.deepEqual(
    stale,
    [],
    `OpenAPI contains stale operations: ${stale.join(", ")}`,
  );

  const operationIds = new Set<string>();
  for (const documented of documentedOperations) {
    const key = operationKey(documented);
    assert.ok(documented.operation.operationId, `${key} missing operationId`);
    assert.ok(documented.operation.summary, `${key} missing summary`);
    assert.ok(documented.operation.responses, `${key} missing responses`);
    assert.ok(
      !operationIds.has(documented.operation.operationId),
      `Duplicate operationId: ${documented.operation.operationId}`,
    );
    operationIds.add(documented.operation.operationId);
    if (requiresSession(documented.path, documented.method)) {
      assert.ok(
        hasSessionCookie(documented.operation),
        `${key} missing sessionCookie security`,
      );
    }
  }

  for (const schema of [
    "ApiError",
    "Pagination",
    "Product",
    "Order",
    "Category",
    "Review",
    "QuoteRequest",
    "Conversation",
    "Message",
    "Notification",
    "AuditLog",
  ]) {
    assert.ok(
      document.components?.schemas?.[schema],
      `OpenAPI schema missing: ${schema}`,
    );
  }
  assert.ok(
    document.components?.securitySchemes?.sessionCookie,
    "OpenAPI security scheme missing: sessionCookie",
  );

  return { document, sourceOperations, documentedOperations };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  await validateOpenApiCoverage();
  console.log("Complete OpenAPI coverage validated");
}
