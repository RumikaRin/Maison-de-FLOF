import { readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import {
  discoverApiOperations,
  type ApiOperation,
} from "./api-route-inventory.ts";
import { isMainModule } from "./is-main-module.ts";

type OpenApiDocument = {
  info: { title: string; version: string; description?: string };
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const METHOD_ORDER = ["parameters", "get", "post", "patch", "delete"];

function pascal(value: string) {
  return value
    .replace(/[{}]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function operationId(operation: ApiOperation) {
  const segments = operation.path
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((segment) =>
      segment.startsWith("{")
        ? `By${pascal(segment)}`
        : pascal(segment),
    );
  return `${operation.method}${segments.join("")}`;
}

function requiresSession(pathname: string, method: ApiOperation["method"]) {
  if (pathname.startsWith("/api/admin/")) return true;
  if (pathname.startsWith("/api/profile")) return true;
  if (pathname.startsWith("/api/visualizer/designs")) return true;
  if (pathname === "/api/orders") return true;
  if (pathname === "/api/orders/{orderNumber}") return true;
  if (pathname === "/api/reviews" && method === "post") return true;
  return pathname === "/api/chat/conversation";
}

function contractTier(operation: ApiOperation) {
  if (
    operation.path.startsWith("/api/admin/media") ||
    operation.path === "/api/auth/{nextauth}"
  ) {
    return "provider";
  }
  if (operation.path.startsWith("/api/vnpay/")) return "simulated";
  if (operation.method !== "get") return "detailed";
  return "stable-minimal";
}

function pathParameters(pathname: string) {
  return [...pathname.matchAll(/\{([^}]+)\}/g)].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

function domainSchema(pathname: string) {
  if (pathname.includes("categories")) return "Category";
  if (pathname.includes("reviews")) return "Review";
  if (pathname.includes("quote")) return "QuoteRequest";
  if (pathname.includes("notifications")) return "Notification";
  if (pathname.includes("audit-logs")) return "AuditLog";
  if (pathname.includes("chat")) return "Conversation";
  return null;
}

function responseSchema(operation: ApiOperation) {
  if (operation.method === "delete") {
    return { $ref: "#/components/schemas/Success" };
  }
  const schema = domainSchema(operation.path);
  if (schema) {
    return {
      oneOf: [
        { $ref: `#/components/schemas/${schema}` },
        {
          type: "array",
          items: { $ref: `#/components/schemas/${schema}` },
        },
      ],
    };
  }
  return {
    oneOf: [
      { $ref: "#/components/schemas/GenericObject" },
      { $ref: "#/components/schemas/GenericArray" },
    ],
  };
}

function generatedOperation(operation: ApiOperation) {
  const secured = requiresSession(operation.path, operation.method);
  const tier = contractTier(operation);
  const successResponse = {
    description: "Successful response",
    content: {
      "application/json": {
        schema: responseSchema(operation),
      },
    },
  };
  const responses: Record<string, unknown> = {
    "200": successResponse,
    "400": { $ref: "#/components/responses/BadRequest" },
    "500": { $ref: "#/components/responses/InternalError" },
  };
  if (operation.method === "post") {
    responses["201"] = {
      ...successResponse,
      description: "Resource created",
    };
  }
  if (secured) {
    responses["401"] = { $ref: "#/components/responses/Unauthorized" };
    responses["403"] = { $ref: "#/components/responses/Forbidden" };
  }

  const generated: Record<string, unknown> = {
    operationId: operationId(operation),
    summary: `${operation.method.toUpperCase()} ${operation.path}`,
    description:
      tier === "provider"
        ? "Provider-dependent operation; local contract coverage is not live provider verification."
        : tier === "simulated"
          ? "Simulated VNPay operation retained for demo compatibility and excluded from production-readiness claims."
          : "Source-inventoried API operation.",
    "x-contract-tier": tier,
    responses,
  };
  const parameters = pathParameters(operation.path);
  if (parameters.length > 0) generated.parameters = parameters;
  if (secured) generated.security = [{ sessionCookie: [] }];
  if (operation.method === "post" || operation.method === "patch") {
    generated.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object", additionalProperties: true },
        },
      },
    };
  }
  return generated;
}

function addSharedSchemas(document: OpenApiDocument) {
  Object.assign(document.components.schemas, {
    GenericObject: { type: "object", additionalProperties: true },
    GenericArray: {
      type: "array",
      items: { $ref: "#/components/schemas/GenericObject" },
    },
    Success: {
      type: "object",
      required: ["success"],
      properties: { success: { type: "boolean", const: true } },
    },
    Category: {
      type: "object",
      required: ["id", "name", "slug", "isActive"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        nameEn: { type: ["string", "null"] },
        slug: { type: "string" },
        description: { type: ["string", "null"] },
        sortOrder: { type: "integer" },
        isActive: { type: "boolean" },
      },
    },
    Review: {
      type: "object",
      required: ["id", "rating", "comment"],
      properties: {
        id: { type: "string" },
        rating: { type: "integer", minimum: 1, maximum: 5 },
        comment: { type: "string" },
        adminReply: { type: ["string", "null"] },
      },
    },
    QuoteRequest: {
      type: "object",
      required: ["id", "fullName", "phone", "email", "projectType", "status"],
      properties: {
        id: { type: "string" },
        fullName: { type: "string" },
        phone: { type: "string" },
        email: { type: "string", format: "email" },
        projectType: { type: "string" },
        status: {
          type: "string",
          enum: ["PENDING", "CONTACTED", "QUOTED", "CLOSED"],
        },
        adminNote: { type: ["string", "null"] },
      },
    },
    Message: {
      type: "object",
      required: ["id", "conversationId", "senderId", "isAdmin", "content"],
      properties: {
        id: { type: "string" },
        conversationId: { type: "string" },
        senderId: { type: "string" },
        isAdmin: { type: "boolean" },
        content: { type: "string" },
        isRead: { type: "boolean" },
      },
    },
    Conversation: {
      type: "object",
      required: ["id", "userId", "status", "messages"],
      properties: {
        id: { type: "string" },
        userId: { type: "string" },
        status: { type: "string", enum: ["NEW", "IN_PROGRESS", "CLOSED"] },
        messages: {
          type: "array",
          items: { $ref: "#/components/schemas/Message" },
        },
      },
    },
    Notification: {
      type: "object",
      required: ["id", "userId", "type", "title", "message", "isRead"],
      properties: {
        id: { type: "string" },
        userId: { type: "string" },
        type: { type: "string" },
        title: { type: "string" },
        message: { type: "string" },
        isRead: { type: "boolean" },
      },
    },
    AuditLog: {
      type: "object",
      required: ["id", "actorId", "actorEmail", "action", "entityType"],
      properties: {
        id: { type: "string" },
        actorId: { type: "string" },
        actorEmail: { type: "string", format: "email" },
        action: { type: "string" },
        entityType: { type: "string" },
        entityId: { type: ["string", "null"] },
      },
    },
  });
}

export async function syncOpenApiInventory(
  openApiPath = "docs/openapi.yaml",
) {
  const document = parse(
    await readFile(openApiPath, "utf8"),
  ) as OpenApiDocument;
  const operations = await discoverApiOperations();
  document.info.title = "Maison de FLOF API";
  document.info.description =
    "Source-inventoried OpenAPI contract for every Next.js API route.";

  for (const operation of operations) {
    document.paths[operation.path] ??= {};
    const existing = document.paths[operation.path][operation.method] as
      | Record<string, unknown>
      | undefined;
    if (!existing || existing["x-contract-tier"]) {
      document.paths[operation.path][operation.method] =
        generatedOperation(operation);
    }
  }
  addSharedSchemas(document);

  document.paths = Object.fromEntries(
    Object.entries(document.paths)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([apiPath, item]) => [
        apiPath,
        Object.fromEntries(
          Object.entries(item).sort(
            ([left], [right]) =>
              METHOD_ORDER.indexOf(left) - METHOD_ORDER.indexOf(right),
          ),
        ),
      ]),
  );

  await writeFile(openApiPath, stringify(document, { lineWidth: 100 }), "utf8");
  return { operationCount: operations.length };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const result = await syncOpenApiInventory();
  console.log(`OpenAPI inventory synchronized: ${result.operationCount} operations`);
}
