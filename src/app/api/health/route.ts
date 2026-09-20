import { db } from "@/lib/db";
import { resolveRedisEnvironment } from "@/lib/security/redis-environment";
import { checkSystemHealth } from "@/lib/health/health-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const redisEnv = resolveRedisEnvironment(process.env);

  const result = await checkSystemHealth({
    dbPing: async () => {
      await db.$queryRawUnsafe("SELECT 1");
    },
    redisPing: redisEnv
      ? async () => {
          const response = await fetch(`${redisEnv.url}/pipeline`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${redisEnv.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([["PING"]]),
            signal: AbortSignal.timeout(3000),
          });
          return response.ok;
        }
      : undefined,
    resendApiKey: process.env.RESEND_API_KEY,
  });

  const statusCode = result.status === "unhealthy" ? 503 : 200;

  return Response.json(result, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
