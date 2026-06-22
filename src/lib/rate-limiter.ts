/**
 * Unified Rate Limiter.
 * Useful for local development (In-Memory) and production deployments (Upstash Redis REST).
 * 
 * Automatically detects UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 * Falls back safely to In-Memory sliding window rate limiting if Redis environment variables are missing
 * or if the connection fails.
 */
export class UnifiedRateLimiter {
  private store = new Map<string, number[]>();
  private windowMs: number;
  private maxLimit: number;
  private useRedis: boolean;
  private redisUrl?: string;
  private redisToken?: string;

  constructor(windowMs: number, maxLimit: number) {
    this.windowMs = windowMs;
    this.maxLimit = maxLimit;
    
    // Upstash Redis config
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.useRedis = Boolean(this.redisUrl && this.redisToken);
  }

  /**
   * Checks if the request limit has been exceeded for a specific key.
   * Returns metadata indicating the check results.
   */
  async checkLimit(key: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    if (this.useRedis) {
      try {
        return await this.checkRedisLimit(key);
      } catch (error) {
        console.error("Upstash Redis Rate Limiting failed, falling back to In-Memory:", error);
        // Safe fallback to In-Memory
        return this.checkMemoryLimit(key);
      }
    }

    return this.checkMemoryLimit(key);
  }

  private checkMemoryLimit(key: string): {
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
      this.store.set(key, validTimestamps);
      const oldestTimestamp = validTimestamps[0] || now;
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

  private async checkRedisLimit(key: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowSeconds = Math.ceil(this.windowMs / 1000);
    const currentWindowIndex = Math.floor(now / this.windowMs);
    const redisKey = `ratelimit:${key}:${currentWindowIndex}`;

    // Pipeline commands to increment and set TTL on the window key
    const url = `${this.redisUrl}/pipeline`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSeconds],
      ]),
      // Short timeout (1.5 seconds) to avoid blocking requests if Upstash is slow/down
      signal: AbortSignal.timeout(1500), 
    });

    if (!response.ok) {
      throw new Error(`Upstash Redis HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2 || typeof data[0].result !== "number") {
      throw new Error("Invalid pipeline response format");
    }

    const count = data[0].result;
    const remaining = Math.max(0, this.maxLimit - count);
    const resetTime = (currentWindowIndex + 1) * this.windowMs;

    return {
      success: count <= this.maxLimit,
      limit: this.maxLimit,
      remaining,
      resetTime,
    };
  }
}

// Backwards-compatible alias
export { UnifiedRateLimiter as InMemoryRateLimiter };

