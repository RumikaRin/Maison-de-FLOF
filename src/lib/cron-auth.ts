/**
 * Validates Bearer cron secret. Fails closed when CRON_SECRET is missing/empty
 * so "Bearer undefined" cannot authorize requests.
 *
 * Returns a Response on failure, or null when authorized.
 * Uses standard Response (not next/server) so pure unit tests can import it.
 */
export function assertCronAuthorized(request: Request): Response | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return Response.json(
      { error: "Cron endpoint is not configured" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
