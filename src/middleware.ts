import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextRequest, NextResponse } from "next/server";
import { UnifiedRateLimiter } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { getRateLimitPolicy } from "@/lib/security/rate-limit-policy";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import {
  createApiErrorResponse,
  getApiRequestId,
} from "@/lib/api-error-contract";
import {
  DEFAULT_LOCALE,
  isLocaleExcludedPath,
  LOCALE_COOKIE,
  localizedPath,
  resolveLocale,
  stripLocalePrefix,
  unsupportedLocalePrefix,
  type Locale,
} from "@/lib/locale";

const authMiddleware = NextAuth(authConfig).auth;
const runAuthMiddleware = authMiddleware as unknown as (
  request: NextRequest,
  event: unknown,
) => Promise<NextResponse | undefined>;

const isolatedE2eMode =
  process.env.E2E_TEST_MODE === "1" && process.env.VERCEL !== "1";

const rateLimiters = new Map<string, UnifiedRateLimiter>();

function limiterFor(policy: NonNullable<ReturnType<typeof getRateLimitPolicy>>) {
  const failureMode =
    process.env.NODE_ENV === "production" &&
    !isolatedE2eMode &&
    policy.limiter !== "api"
      ? "deny"
      : "memory";
  const effectiveLimit =
    isolatedE2eMode && policy.limiter !== "publicWrite" ? 1000 : policy.limit;
  const key = `${policy.windowMs}:${effectiveLimit}:${failureMode}`;
  let limiter = rateLimiters.get(key);
  if (!limiter) {
    limiter = new UnifiedRateLimiter(policy.windowMs, effectiveLimit, {
      failureMode,
    });
    rateLimiters.set(key, limiter);
  }
  return limiter;
}

function withSecurityHeaders<T extends Response>(response: T, nonce: string) {
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(
      process.env.NODE_ENV === "production" ? "production" : "development",
      nonce,
      { upgradeInsecureRequests: !isolatedE2eMode },
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

function withLocaleCookie<T extends NextResponse>(
  response: T,
  locale: Locale,
) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

function rewriteWithNonce(
  url: URL,
  requestHeaders: Headers,
  nonce: string,
  locale: Locale,
) {
  return withLocaleCookie(
    withSecurityHeaders(
      NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
      nonce,
    ),
    locale,
  );
}

export default async function middleware(request: NextRequest, event: any) {
  const originalPathname = request.nextUrl.pathname;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(
      process.env.NODE_ENV === "production" ? "production" : "development",
      nonce,
      { upgradeInsecureRequests: !isolatedE2eMode },
    ),
  );

  const prefixed = stripLocalePrefix(originalPathname);
  const locale = resolveLocale({
    pathname: originalPathname,
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
  });
  const unsupportedPrefix = unsupportedLocalePrefix(originalPathname);

  if (unsupportedPrefix) {
    const redirectUrl = request.nextUrl.clone();
    const suffix = originalPathname.slice(unsupportedPrefix.length + 1) || "/";
    redirectUrl.pathname = localizedPath(suffix, DEFAULT_LOCALE);
    return withLocaleCookie(
      withSecurityHeaders(NextResponse.redirect(redirectUrl), nonce),
      DEFAULT_LOCALE,
    );
  }

  if (prefixed.hadPrefix && isLocaleExcludedPath(prefixed.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = prefixed.pathname;
    return withSecurityHeaders(NextResponse.redirect(redirectUrl), nonce);
  }

  if (!prefixed.hadPrefix && !isLocaleExcludedPath(originalPathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizedPath(originalPathname, locale);
    return withLocaleCookie(
      withSecurityHeaders(NextResponse.redirect(redirectUrl), nonce),
      locale,
    );
  }

  const pathname = prefixed.hadPrefix
    ? prefixed.pathname
    : originalPathname;
  requestHeaders.set("x-locale", locale);
  
  // Extract client IP address securely
  const ip = getClientIp(request);

  // 1. Rate Limit for sensitive auth endpoints and general API routes
  const rateLimitPolicy = getRateLimitPolicy(pathname, request.method);
  if (rateLimitPolicy) {
    const limiter = limiterFor(rateLimitPolicy);
    const rateCheck = await limiter.checkLimit(`${rateLimitPolicy.keyPrefix}_${ip}`);
    if (!rateCheck.success) {
      const backendUnavailable =
        rateCheck.reason === "BACKEND_UNAVAILABLE";
      const response = createApiErrorResponse(
        {
          status: backendUnavailable ? 503 : 429,
          code: backendUnavailable ? "SERVICE_UNAVAILABLE" : "RATE_LIMITED",
          message: backendUnavailable
            ? "Request protection service is temporarily unavailable."
            : "Too many requests. Please try again later.",
        },
        getApiRequestId(request),
      );
      response.headers.set(
        "Retry-After",
        Math.max(
          0,
          Math.ceil((rateCheck.resetTime - Date.now()) / 1000),
        ).toString(),
      );
      return withSecurityHeaders(response, nonce);
    }
  }

  // 2. Run the authentication guard only where it can block navigation.
  // Public/API routes must preserve the request override so Next.js can apply
  // the nonce to framework scripts during rendering.
  const needsAuthGuard =
    pathname.startsWith("/admin") || pathname.startsWith("/profile");
  if (!needsAuthGuard) {
    if (prefixed.hadPrefix) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = pathname;
      return rewriteWithNonce(rewriteUrl, requestHeaders, nonce, locale);
    }
    return nextWithNonce(requestHeaders, nonce);
  }

  const authUrl = request.nextUrl.clone();
  authUrl.pathname = pathname;
  const requestWithNonce = new NextRequest(authUrl, { headers: requestHeaders });
  const authResponse = await runAuthMiddleware(requestWithNonce, event);
  const isPassThrough =
    !authResponse || authResponse.headers.get("x-middleware-next") === "1";

  if (!isPassThrough) return withSecurityHeaders(authResponse, nonce);

  const response = prefixed.hadPrefix
    ? rewriteWithNonce(authUrl, requestHeaders, nonce, locale)
    : nextWithNonce(requestHeaders, nonce);
  for (const cookie of authResponse?.cookies?.getAll?.() ?? []) {
    response.cookies.set(cookie);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
