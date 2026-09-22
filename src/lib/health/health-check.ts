export type ServiceStatus = "up" | "down" | "disabled" | "configured" | "not_configured";

export type HealthCheckResult = {
  status: "healthy" | "degraded" | "unhealthy";
  uptimeSeconds: number;
  totalLatencyMs: number;
  timestamp: string;
  services: {
    database: { status: ServiceStatus; latencyMs?: number; message?: string };
    redis: { status: ServiceStatus; latencyMs?: number; message?: string };
    email: { status: ServiceStatus; message?: string };
  };
};

export type HealthCheckDependencies = {
  dbPing: () => Promise<void>;
  redisPing?: () => Promise<boolean>;
  resendApiKey?: string;
  uptimeProvider?: () => number;
};

export async function checkSystemHealth(
  deps: HealthCheckDependencies,
): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  const uptimeSeconds = Math.round(deps.uptimeProvider ? deps.uptimeProvider() : process.uptime());

  // 1. Database
  const dbStart = Date.now();
  let dbResult: { status: ServiceStatus; latencyMs?: number; message?: string };
  try {
    await deps.dbPing();
    dbResult = { status: "up", latencyMs: Date.now() - dbStart };
  } catch (error) {
    dbResult = {
      status: "down",
      latencyMs: Date.now() - dbStart,
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }

  // 2. Redis
  let redisResult: { status: ServiceStatus; latencyMs?: number; message?: string };
  if (!deps.redisPing) {
    redisResult = {
      status: "disabled",
      message: "Redis not configured",
    };
  } else {
    const redisStart = Date.now();
    try {
      const ok = await deps.redisPing();
      if (ok) {
        redisResult = { status: "up", latencyMs: Date.now() - redisStart };
      } else {
        redisResult = { status: "down", latencyMs: Date.now() - redisStart, message: "Redis ping failed" };
      }
    } catch (error) {
      redisResult = {
        status: "down",
        latencyMs: Date.now() - redisStart,
        message: error instanceof Error ? error.message : "Redis error",
      };
    }
  }

  // 3. Email
  let emailResult: { status: ServiceStatus; message?: string };
  if (deps.resendApiKey && deps.resendApiKey.startsWith("re_")) {
    emailResult = { status: "configured" };
  } else {
    emailResult = { status: "not_configured", message: "RESEND_API_KEY missing or invalid" };
  }

  const isHealthy = dbResult.status === "up";
  const overallStatus = !isHealthy
    ? "unhealthy"
    : redisResult.status === "down"
      ? "degraded"
      : "healthy";

  return {
    status: overallStatus,
    uptimeSeconds,
    totalLatencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    services: {
      database: dbResult,
      redis: redisResult,
      email: emailResult,
    },
  };
}
