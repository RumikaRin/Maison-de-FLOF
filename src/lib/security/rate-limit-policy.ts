export type RateLimitPolicy = {
  keyPrefix: "auth" | "register" | "api" | "quote" | "guest-chat";
  limiter: "auth" | "api" | "publicWrite";
};

export function getRateLimitPolicy(pathname: string): RateLimitPolicy | null {
  if (pathname === "/api/quote-request") {
    return { keyPrefix: "quote", limiter: "publicWrite" };
  }

  if (pathname === "/api/chat") {
    return { keyPrefix: "guest-chat", limiter: "publicWrite" };
  }

  if (pathname === "/api/auth/callback/credentials") {
    return { keyPrefix: "auth", limiter: "auth" };
  }

  if (pathname === "/api/auth/register") {
    return { keyPrefix: "register", limiter: "auth" };
  }

  if (
    pathname === "/api/auth/forgot-password" ||
    pathname === "/api/auth/reset-password"
  ) {
    return { keyPrefix: "auth", limiter: "auth" };
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return { keyPrefix: "api", limiter: "api" };
  }

  return null;
}
