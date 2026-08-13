import { apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  createVisualizerDesign,
  listVisualizerDesigns,
} from "@/services/visualizer.service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    return Response.json({
      data: await listVisualizerDesigns(db, user.id),
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const design = await createVisualizerDesign(
      db,
      user.id,
      await request.json(),
    );
    return Response.json({ data: design }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
