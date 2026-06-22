export type RateLimitPolicy = {
  keyPrefix: "auth" | "register" | "api";
  limiter: "auth" | "api";
};

export function getRateLimitPolicy(pathname: string): RateLimitPolicy | null {
  if (pathname === "/api/auth/callback/credentials") {
    return { keyPrefix: "auth", limiter: "auth" };
  }

  if (pathname === "/api/auth/register") {
    return { keyPrefix: "register", limiter: "auth" };
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return { keyPrefix: "api", limiter: "api" };
  }

  return null;
}
