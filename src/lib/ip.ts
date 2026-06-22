import type { NextRequest } from "next/server";

/**
 * Safely extracts the client IP address from the request.
 * Prioritizes trusted proxy headers provided by platforms like Vercel and Cloudflare,
 * and parses x-forwarded-for securely by taking the first client IP.
 */
export function getClientIp(request: NextRequest | Request): string {
  // 1. Check next-auth / NextRequest standard property if available
  const requestIp = (request as any).ip;
  if (typeof requestIp === "string" && requestIp) {
    return requestIp;
  }

  const headers = request.headers;

  // 2. Vercel specific real IP header
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  // 3. Cloudflare specific connecting IP header
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  // 4. Standard x-forwarded-for header (take the first client IP)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ip = xForwardedFor.split(",")[0].trim();
    if (ip) return ip;
  }

  // 5. Fallback local address
  return "127.0.0.1";
}
