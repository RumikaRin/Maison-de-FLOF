import { apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { exportUserData } from "@/services/privacy.service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const archive = await exportUserData(db, user.id);
    return new Response(JSON.stringify(archive), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition":
          'attachment; filename="flof-personal-data.json"',
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
