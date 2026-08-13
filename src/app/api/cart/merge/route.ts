import { apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { mergeCart } from "@/services/cart.service";

/**
 * Sign-in merge: union the guest's local cart into the server cart, so logging
 * in on a second device never drops what was already in either cart.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    return Response.json({ data: await mergeCart(db, user.id, await request.json()) });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
