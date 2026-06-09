/**
 * In-Memory Sliding Window Rate Limiter.
 * Useful for local development and single-instance deployments (VPS, VMs).
 * 
 * NOTE: For serverless / multi-instance environments (like Vercel production),
 * memory is not shared across instances. In such cases, replace this implementation
 * with a shared database client (e.g., Upstash Redis with `@upstash/ratelimit`).
 */
export class InMemoryRateLimiter {
  private store = new Map<string, number[]>();
  private windowMs: number;
  private maxLimit: number;

  constructor(windowMs: number, maxLimit: number) {
    this.windowMs = windowMs;
    this.maxLimit = maxLimit;
  }

  /**
   * Checks if the request limit has been exceeded for a specific key.
   * Returns metadata indicating the check results.
   */
  checkLimit(key: string): {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const timestamps = this.store.get(key) || [];

    // Filter out timestamps older than the window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxLimit) {
      // Limit exceeded
      this.store.set(key, validTimestamps);
      const oldestTimestamp = validTimestamps[0];
      const resetTime = oldestTimestamp + this.windowMs;

      return {
        success: false,
        limit: this.maxLimit,
        remaining: 0,
        resetTime,
      };
    }

    // Add current timestamp and save
    validTimestamps.push(now);
    this.store.set(key, validTimestamps);

    return {
      success: true,
      limit: this.maxLimit,
      remaining: this.maxLimit - validTimestamps.length,
      resetTime: now + this.windowMs,
    };
  }
}
