import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { InMemoryRateLimiter } from "@/lib/rate-limiter";

const authMiddleware = NextAuth(authConfig).auth;

// Instantiate rate limiters in module scope to persist across requests
const authLimiter = new InMemoryRateLimiter(60 * 1000, 10); // 10 attempts per minute
const apiLimiter = new InMemoryRateLimiter(60 * 1000, 60);  // 60 requests per minute

export default async function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl;
  
  // Extract client IP address
  const ip = request.headers.get("x-forwarded-for") || (request as any).ip || "127.0.0.1";

  // 1. Rate Limit for Credentials Auth (Login brute-force protection)
  if (pathname === "/api/auth/callback/credentials") {
    const rateCheck = authLimiter.checkLimit(`auth_${ip}`);
    if (!rateCheck.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
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

  // 2. Rate Limit for general API routes
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const rateCheck = apiLimiter.checkLimit(`api_${ip}`);
    if (!rateCheck.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
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

  // 3. Delegate to authentication middleware
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
