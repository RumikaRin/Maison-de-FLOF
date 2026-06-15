import { NextRequest } from "next/server";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

export function rateLimit(
  req: NextRequest,
  limit: number = 60, // Default: 60 requests per window
  windowMs: number = 60000 // Default: 1 minute
) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const now = Date.now();
  
  let info = rateLimitMap.get(ip);
  
  if (!info || info.resetTime < now) {
    info = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, info);
    return { success: true, remaining: limit - 1, reset: info.resetTime };
  }
  
  if (info.count >= limit) {
    return { success: false, remaining: 0, reset: info.resetTime };
  }
  
  info.count++;
  return { success: true, remaining: limit - info.count, reset: info.resetTime };
}
