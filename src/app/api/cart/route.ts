import { apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getCart, replaceCart } from "@/services/cart.service";

/** The authenticated user's server-side cart, hydrated for rendering. */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    return Response.json({ data: await getCart(db, user.id) });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}

/** Replace the whole cart with a client snapshot (the sync-on-change path). */
export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    return Response.json({ data: await replaceCart(db, user.id, await request.json()) });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
