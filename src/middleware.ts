import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextRequest, NextResponse } from "next/server";
import { UnifiedRateLimiter } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { getRateLimitPolicy } from "@/lib/security/rate-limit-policy";
import { buildContentSecurityPolicy } from "@/lib/security/headers";

const authMiddleware = NextAuth(authConfig).auth;
const runAuthMiddleware = authMiddleware as unknown as (
  request: NextRequest,
  event: unknown,
) => Promise<NextResponse | undefined>;

// Instantiate rate limiters in module scope to persist across requests
const authLimiter = new UnifiedRateLimiter(60 * 1000, 10, {
  failureMode: process.env.NODE_ENV === "production" ? "deny" : "memory",
});
const apiLimiter = new UnifiedRateLimiter(60 * 1000, 60, {
  failureMode: "memory",
});

function withSecurityHeaders<T extends Response>(response: T, nonce: string) {
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(
      process.env.NODE_ENV === "production" ? "production" : "development",
      nonce,
    ),
  );
  return response;
}

function nextWithNonce(requestHeaders: Headers, nonce: string) {
  return withSecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
    nonce,
  );
}

export default async function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(
      process.env.NODE_ENV === "production" ? "production" : "development",
      nonce,
    ),
  );
  
  // Extract client IP address securely
  const ip = getClientIp(request);

  // 1. Rate Limit for sensitive auth endpoints and general API routes
  const rateLimitPolicy = getRateLimitPolicy(pathname);
  if (rateLimitPolicy) {
    const limiter = rateLimitPolicy.limiter === "auth" ? authLimiter : apiLimiter;
    const rateCheck = await limiter.checkLimit(`${rateLimitPolicy.keyPrefix}_${ip}`);
    if (!rateCheck.success) {
      const backendUnavailable =
        rateCheck.reason === "BACKEND_UNAVAILABLE";
      return withSecurityHeaders(new NextResponse(
        JSON.stringify({
          error: backendUnavailable
            ? "Request protection service is temporarily unavailable."
            : rateLimitPolicy.limiter === "auth"
              ? "Too many attempts. Please try again later."
              : "Too many requests. Please slow down.",
        }),
        {
          status: backendUnavailable ? 503 : 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
          },
        },
      ), nonce);
    }
  }

  // 2. Run the authentication guard only where it can block navigation.
  // Public/API routes must preserve the request override so Next.js can apply
  // the nonce to framework scripts during rendering.
  const needsAuthGuard =
    pathname.startsWith("/admin") || pathname.startsWith("/profile");
  if (!needsAuthGuard) return nextWithNonce(requestHeaders, nonce);

  const requestWithNonce = new NextRequest(request, { headers: requestHeaders });
  const authResponse = await runAuthMiddleware(requestWithNonce, event);
  const isPassThrough =
    !authResponse || authResponse.headers.get("x-middleware-next") === "1";

  if (!isPassThrough) return withSecurityHeaders(authResponse, nonce);

  const response = nextWithNonce(requestHeaders, nonce);
  for (const cookie of authResponse?.cookies.getAll() ?? []) {
    response.cookies.set(cookie);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
