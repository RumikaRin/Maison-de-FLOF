export type RateLimitPolicy = {
  keyPrefix:
    | "auth"
    | "register"
    | "forgot-password"
    | "reset-password"
    | "resend-verification"
    | "delete-account"
    | "api"
    | "quote"
    | "guest-chat"
    | "review"
    | "newsletter";
  limiter: "auth" | "api" | "publicWrite";
  limit: number;
  windowMs: number;
};

const WINDOW_MS = 60_000;

function policy(
  keyPrefix: RateLimitPolicy["keyPrefix"],
  limiter: RateLimitPolicy["limiter"],
  limit: number,
): RateLimitPolicy {
  return { keyPrefix, limiter, limit, windowMs: WINDOW_MS };
}

export function getRateLimitPolicy(
  pathname: string,
  method?: string,
): RateLimitPolicy | null {
  const isWrite = method ? !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) : true;

  if (isWrite && pathname === "/api/quote-request") {
    return policy("quote", "publicWrite", 5);
  }
  if (isWrite && pathname === "/api/chat") {
    return policy("guest-chat", "publicWrite", 5);
  }
  if (isWrite && pathname === "/api/reviews") {
    return policy("review", "publicWrite", 10);
  }
  if (isWrite && pathname === "/api/newsletter") {
    return policy("newsletter", "publicWrite", 5);
  }
  // Cart sync fires on every change (debounced) — needs a higher ceiling than a
  // public write, and it's authenticated, so it rides the general api bucket.
  if (pathname === "/api/auth/callback/credentials") {
    return policy("auth", "auth", 10);
  }
  if (isWrite && pathname === "/api/auth/register") {
    return policy("register", "auth", 5);
  }
  if (isWrite && pathname === "/api/auth/forgot-password") {
    return policy("forgot-password", "auth", 5);
  }
  if (isWrite && pathname === "/api/auth/reset-password") {
    return policy("reset-password", "auth", 5);
  }
  if (isWrite && pathname === "/api/auth/resend-verification") {
    return policy("resend-verification", "auth", 5);
  }
  if (isWrite && pathname === "/api/profile/delete-account") {
    return policy("delete-account", "auth", 5);
  }
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return policy("api", "api", 60);
  }
  return null;
}
