export type AppRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type Permission =
  | "ORDER_READ"
  | "ORDER_UPDATE"
  | "PAYMENT_CONFIRM"
  | "INVENTORY_IMPORT"
  | "SUPPORT_MANAGE"
  | "CATALOG_MANAGE"
  | "PROMOTION_MANAGE"
  | "COUPON_MANAGE"
  | "MEDIA_DELETE"
  | "USER_MANAGE";

const staffPermissions = new Set<Permission>([
  "ORDER_READ",
  "ORDER_UPDATE",
  "PAYMENT_CONFIRM",
  "INVENTORY_IMPORT",
  "SUPPORT_MANAGE",
]);

export function hasPermission(role: AppRole, permission: Permission) {
  return role === "ADMIN" || (role === "STAFF" && staffPermissions.has(permission));
}
