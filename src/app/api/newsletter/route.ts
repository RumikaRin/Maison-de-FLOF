import { z } from "zod";

import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { subscribeToNewsletter } from "@/lib/newsletter";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
});

/**
 * Public newsletter subscription. Rate-limited as a public write in
 * lib/security/rate-limit-policy.ts. Always answers with a generic success so
 * the endpoint cannot be used to enumerate which addresses are subscribed.
 */
export async function POST(request: Request) {
  try {
    const parsed = subscribeSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Email không hợp lệ");
    }

    await subscribeToNewsletter(db, parsed.data.email);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
