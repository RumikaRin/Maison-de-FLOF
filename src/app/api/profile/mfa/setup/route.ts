import { ApiError, apiErrorResponse, requireAdmin } from "@/lib/api-auth";
import { beginMfaSetup } from "@/services/mfa.service";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    try {
      return Response.json(await beginMfaSetup(admin.id, admin.email));
    } catch (error) {
      if (error instanceof Error && error.message === "MFA_ALREADY_ENABLED") {
        throw new ApiError(409, "MFA đã được kích hoạt");
      }
      throw error;
    }
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
