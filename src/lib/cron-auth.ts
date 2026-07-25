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
    return jsonApiError(
      request,
      503,
      "INTERNAL_ERROR",
      "Cron endpoint is not configured",
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return jsonApiError(request, 401, "UNAUTHORIZED", "Unauthorized");
  }

  return null;
}
import { jsonApiError } from "./api-error-contract.ts";
