import { stripLocalePrefix } from "./locale.ts";

export type MobileRouteMode =
  | "browse"
  | "product"
  | "transaction"
  | "account"
  | "reading"
  | "admin";

export type ContextualAction =
  | "none"
  | "product-purchase"
  | "cart-checkout";

export type MobileSurfacePolicy = {
  mode: MobileRouteMode;
  bottomNavigation: boolean;
  contextualAction: ContextualAction;
  chat: boolean;
};

const browsePaths = new Set([
  "/",
  "/products",
  "/colors",
  "/color-visualizer",
  "/find-dealer",
  "/blog",
]);

const accountPaths = new Set([
  "/profile",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

const readingPaths = new Set([
  "/privacy-policy",
  "/cookie-policy",
  "/terms-of-service",
]);

const noAction = {
  contextualAction: "none" as const,
};

export function getMobileSurfacePolicy(pathname: string): MobileSurfacePolicy {
  const path = stripLocalePrefix(pathname).pathname.replace(/\/$/, "") || "/";

  if (path === "/admin" || path.startsWith("/admin/")) {
    return {
      mode: "admin",
      bottomNavigation: false,
      ...noAction,
      chat: false,
    };
  }

  if (path.startsWith("/products/")) {
    return {
      mode: "product",
      bottomNavigation: false,
      contextualAction: "product-purchase",
      chat: false,
    };
  }

  if (path === "/cart") {
    return {
      mode: "transaction",
      bottomNavigation: false,
      contextualAction: "cart-checkout",
      chat: false,
    };
  }

  if (
    path === "/checkout" ||
    path === "/checkout/success" ||
    path === "/quote-request"
  ) {
    return {
      mode: "transaction",
      bottomNavigation: false,
      ...noAction,
      chat: false,
    };
  }

  if (accountPaths.has(path) || path.startsWith("/profile/")) {
    return {
      mode: "account",
      bottomNavigation: false,
      ...noAction,
      chat: false,
    };
  }

  if (path.startsWith("/blog/") || readingPaths.has(path)) {
    return {
      mode: "reading",
      bottomNavigation: false,
      ...noAction,
      chat: path.startsWith("/blog/"),
    };
  }

  return {
    mode: "browse",
    bottomNavigation: browsePaths.has(path),
    ...noAction,
    chat: true,
  };
}
