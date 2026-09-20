import type { NextRequest } from "next/server";

// Edge-safe IPv4 & IPv6 format validation (zero Node.js dependencies for Edge runtime compatibility)
const IPV4_REGEX =
  /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;

const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export function isValidIp(candidate: string): boolean {
  return IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate);
}

function sanitizeCandidateIp(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  return isValidIp(trimmed) ? trimmed : null;
}

/**
 * Safely extracts the client IP address from the request.
 * Prioritizes trusted proxy headers provided by platforms like Vercel and Cloudflare,
 * and parses x-forwarded-for securely with IP structure validation.
 * Compatible with Next.js Edge Runtime (Middleware) and Node.js runtime.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;

  // 1. Platform-trusted single IP headers (Vercel / Cloudflare)
  const xRealIp = sanitizeCandidateIp(headers.get("x-real-ip"));
  if (xRealIp) return xRealIp;

  const cfConnectingIp = sanitizeCandidateIp(headers.get("cf-connecting-ip"));
  if (cfConnectingIp) return cfConnectingIp;

  // 2. NextRequest standard property if available
  const requestIp = sanitizeCandidateIp((request as any).ip);
  if (requestIp) return requestIp;

  // 3. Standard x-forwarded-for header (take first valid IP component)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",");
    for (const part of parts) {
      const candidate = sanitizeCandidateIp(part);
      if (candidate) return candidate;
    }
  }

  // 4. Fallback local address
  return "127.0.0.1";
}
