import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { InMemoryRateLimiter } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { getRateLimitPolicy } from "@/lib/security/rate-limit-policy";

const authMiddleware = NextAuth(authConfig).auth;

// Instantiate rate limiters in module scope to persist across requests
const authLimiter = new InMemoryRateLimiter(60 * 1000, 10); // 10 attempts per minute
const apiLimiter = new InMemoryRateLimiter(60 * 1000, 60);  // 60 requests per minute

export default async function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl;
  
  // Extract client IP address securely
  const ip = getClientIp(request);

  // 1. Rate Limit for sensitive auth endpoints and general API routes
  const rateLimitPolicy = getRateLimitPolicy(pathname);
  if (rateLimitPolicy) {
    const limiter = rateLimitPolicy.limiter === "auth" ? authLimiter : apiLimiter;
    const rateCheck = await limiter.checkLimit(`${rateLimitPolicy.keyPrefix}_${ip}`);
    if (!rateCheck.success) {
      return new NextResponse(
        JSON.stringify({
          error:
            rateLimitPolicy.limiter === "auth"
              ? "Too many attempts. Please try again later."
              : "Too many requests. Please slow down.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // 2. Delegate to authentication middleware
  return authMiddleware(request as any, event);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/api/auth/:path*",
    "/api/:path*",
  ],
};
