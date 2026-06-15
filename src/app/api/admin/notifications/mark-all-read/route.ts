import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "STAFF")) {
      throw new ApiError(401, "Unauthorized");
    }

    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
