import { NextRequest } from "next/server";
import { UnifiedRateLimiter } from "./rate-limiter";
import { getClientIp } from "./ip";

// Cache rate limiters by configuration to reuse them
const limiters = new Map<string, UnifiedRateLimiter>();

export async function rateLimit(
  req: NextRequest,
  limit: number = 60, // Default: 60 requests per window
  windowMs: number = 60000 // Default: 1 minute
) {
  const ip = getClientIp(req);
  const registryKey = `${limit}_${windowMs}`;

  let limiter = limiters.get(registryKey);
  if (!limiter) {
    limiter = new UnifiedRateLimiter(windowMs, limit);
    limiters.set(registryKey, limiter);
  }

  const rateCheck = await limiter.checkLimit(`api_${ip}`);

  return {
    success: rateCheck.success,
    remaining: rateCheck.remaining,
    reset: rateCheck.resetTime,
  };
}

