import { resolveRedisEnvironment } from "../security/redis-environment.ts";
import type { RoleType } from "@prisma/client";

export type CachedSessionData = {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  cachedAt: number;
  user: {
    email: string;
    sessionVersion: number;
    role: { type: RoleType };
  };
};

const SESSION_CACHE_TTL_SECONDS = 60;

function getRedisConfig() {
  const env = resolveRedisEnvironment(process.env);
  if (!env?.url || !env?.token) return null;
  return { url: env.url, token: env.token };
}

export async function getCachedSession(sessionId: string): Promise<CachedSessionData | null> {
  const config = getRedisConfig();
  if (!config) return null;

  try {
    const key = `auth:session:${sessionId}`;
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", key]),
      signal: AbortSignal.timeout(1000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data.result !== "string") return null;

    const parsed = JSON.parse(data.result) as CachedSessionData;

    // Verify if user sessions were invalidated after this cache entry was created
    if (parsed.userId && typeof parsed.cachedAt === "number") {
      const isInvalidated = await isUserSessionCacheInvalidated(parsed.userId, parsed.cachedAt);
      if (isInvalidated) {
        await invalidateCachedSession(sessionId);
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedSession(sessionId: string, session: Omit<CachedSessionData, "cachedAt">): Promise<void> {
  const config = getRedisConfig();
  if (!config) return;

  try {
    const key = `auth:session:${sessionId}`;
    const payload: CachedSessionData = {
      ...session,
      cachedAt: Date.now(),
    };
    await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "SETEX",
        key,
        SESSION_CACHE_TTL_SECONDS,
        JSON.stringify(payload),
      ]),
      signal: AbortSignal.timeout(1000),
    });
  } catch {
    // Non-blocking
  }
}

export async function invalidateCachedSession(sessionId: string): Promise<void> {
  const config = getRedisConfig();
  if (!config) return;

  try {
    const key = `auth:session:${sessionId}`;
    await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["DEL", key]),
      signal: AbortSignal.timeout(1000),
    });
  } catch {
    // Non-blocking
  }
}

export async function invalidateUserSessionCache(userId: string): Promise<void> {
  const config = getRedisConfig();
  if (!config) return;

  try {
    const key = `auth:user:invalidated:${userId}`;
    await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "SETEX",
        key,
        SESSION_CACHE_TTL_SECONDS * 2,
        Date.now().toString(),
      ]),
      signal: AbortSignal.timeout(1000),
    });
  } catch {
    // Non-blocking
  }
}

async function isUserSessionCacheInvalidated(userId: string, cachedAtMs: number): Promise<boolean> {
  const config = getRedisConfig();
  if (!config) return false;

  try {
    const key = `auth:user:invalidated:${userId}`;
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", key]),
      signal: AbortSignal.timeout(1000),
    });

    if (!response.ok) return false;
    const data = await response.json();
    if (!data || typeof data.result !== "string") return false;

    const invalidatedAt = Number(data.result);
    return Number.isFinite(invalidatedAt) && invalidatedAt >= cachedAtMs;
  } catch {
    return false;
  }
}
