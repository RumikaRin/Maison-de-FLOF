import { apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  deleteVisualizerDesign,
  getVisualizerDesign,
  updateVisualizerDesign,
} from "@/services/visualizer.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    return Response.json({
      data: await getVisualizerDesign(db, user.id, id),
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    return Response.json({
      data: await updateVisualizerDesign(
        db,
        user.id,
        id,
        await request.json(),
      ),
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    return Response.json(
      await deleteVisualizerDesign(db, user.id, id),
    );
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
