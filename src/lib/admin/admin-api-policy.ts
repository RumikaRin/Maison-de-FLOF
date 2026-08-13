import type { Permission } from "../permissions";

export type AdminApiPolicy = {
  route: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  access:
    | { kind: "role"; minimum: "STAFF" | "ADMIN" }
    | { kind: "permission"; permission: Permission };
  mutation: boolean;
  audit: "required" | "not-required" | "provider-managed" | "gap";
  verification:
    | "unit-policy"
    | "db-integration"
    | "e2e"
    | "provider-contract";
};

const staff = { kind: "role", minimum: "STAFF" } as const;
const admin = { kind: "role", minimum: "ADMIN" } as const;
const permission = (value: Permission) =>
  ({ kind: "permission", permission: value }) as const;

function read(
  route: string,
  access: AdminApiPolicy["access"] = staff,
  verification: AdminApiPolicy["verification"] = "unit-policy",
): AdminApiPolicy {
  return {
    route,
    method: "GET",
    access,
    mutation: false,
    audit: "not-required",
    verification,
  };
}

function mutation(
  route: string,
  method: "POST" | "PATCH" | "DELETE",
  access: AdminApiPolicy["access"],
  verification: AdminApiPolicy["verification"] = "unit-policy",
  audit: AdminApiPolicy["audit"] = "required",
): AdminApiPolicy {
  return { route, method, access, mutation: true, audit, verification };
}

export const ADMIN_API_POLICIES: readonly AdminApiPolicy[] = [
  read("/api/admin/articles"),
  mutation("/api/admin/articles", "POST", permission("CATALOG_MANAGE")),
  mutation("/api/admin/articles", "PATCH", permission("CATALOG_MANAGE")),
  mutation("/api/admin/articles", "DELETE", permission("CATALOG_MANAGE")),

  read("/api/admin/audit-logs", admin, "e2e"),

  read("/api/admin/categories", staff, "db-integration"),
  mutation(
    "/api/admin/categories",
    "POST",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/categories",
    "PATCH",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/categories",
    "DELETE",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),

  read("/api/admin/chat", staff),
  mutation("/api/admin/chat", "PATCH", staff),
  read("/api/admin/chat/conversations", staff, "db-integration"),
  mutation(
    "/api/admin/chat/conversations",
    "POST",
    staff,
    "db-integration",
  ),
  read("/api/admin/chat/conversations/[id]", staff, "db-integration"),

  read("/api/admin/collections"),
  mutation(
    "/api/admin/collections",
    "POST",
    permission("CATALOG_MANAGE"),
  ),
  mutation(
    "/api/admin/collections",
    "PATCH",
    permission("CATALOG_MANAGE"),
  ),
  mutation(
    "/api/admin/collections",
    "DELETE",
    permission("CATALOG_MANAGE"),
  ),

  read("/api/admin/colors", staff, "db-integration"),
  mutation(
    "/api/admin/colors",
    "POST",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/colors",
    "PATCH",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/colors",
    "DELETE",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),

  read("/api/admin/coupons"),
  mutation("/api/admin/coupons", "POST", permission("COUPON_MANAGE")),
  mutation("/api/admin/coupons", "PATCH", permission("COUPON_MANAGE")),
  mutation("/api/admin/coupons", "DELETE", permission("COUPON_MANAGE")),

  read("/api/admin/dashboard"),

  read("/api/admin/dealers"),
  mutation("/api/admin/dealers", "POST", permission("CATALOG_MANAGE")),
  mutation("/api/admin/dealers", "PATCH", permission("CATALOG_MANAGE")),
  mutation("/api/admin/dealers", "DELETE", permission("CATALOG_MANAGE")),

  read("/api/admin/inventory"),
  mutation(
    "/api/admin/inventory",
    "POST",
    permission("INVENTORY_IMPORT"),
    "db-integration",
  ),

  read("/api/admin/media", staff, "provider-contract"),
  mutation(
    "/api/admin/media",
    "POST",
    staff,
    "provider-contract",
    "provider-managed",
  ),
  mutation(
    "/api/admin/media",
    "DELETE",
    permission("MEDIA_DELETE"),
    "provider-contract",
    "provider-managed",
  ),

  read("/api/admin/notifications"),
  mutation("/api/admin/notifications/[id]/read", "PATCH", staff),
  mutation("/api/admin/notifications/mark-all-read", "POST", staff),

  read("/api/admin/payments", permission("ORDER_READ")),
  mutation(
    "/api/admin/payments",
    "PATCH",
    permission("PAYMENT_CONFIRM"),
    "db-integration",
  ),

  read("/api/admin/products", staff, "db-integration"),
  mutation(
    "/api/admin/products",
    "POST",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/products",
    "PATCH",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/products",
    "DELETE",
    permission("CATALOG_MANAGE"),
    "db-integration",
  ),
  mutation(
    "/api/admin/products/promotions",
    "PATCH",
    permission("PROMOTION_MANAGE"),
  ),

  read("/api/admin/quotes", staff, "db-integration"),
  mutation("/api/admin/quotes", "PATCH", staff, "db-integration"),

  read("/api/admin/reviews", staff, "db-integration"),
  mutation("/api/admin/reviews", "PATCH", staff, "db-integration"),
  mutation("/api/admin/reviews", "DELETE", staff, "db-integration"),

  read("/api/admin/suppliers"),
  mutation(
    "/api/admin/suppliers",
    "POST",
    permission("CATALOG_MANAGE"),
  ),
  mutation(
    "/api/admin/suppliers",
    "PATCH",
    permission("CATALOG_MANAGE"),
  ),
  mutation(
    "/api/admin/suppliers",
    "DELETE",
    permission("CATALOG_MANAGE"),
  ),

  read("/api/admin/users", admin),
  mutation("/api/admin/users", "POST", admin),
  mutation("/api/admin/users", "PATCH", admin),
  mutation("/api/admin/users", "DELETE", admin),
];
