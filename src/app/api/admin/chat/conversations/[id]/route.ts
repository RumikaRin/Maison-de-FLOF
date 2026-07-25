import { db } from "@/lib/db";
import { apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { readConversationAsStaff } from "@/lib/customer-workflow-service";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireStaff();
    const { id } = await props.params;
    const conversation = await readConversationAsStaff(db, actor, id);
    return Response.json(conversation);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
