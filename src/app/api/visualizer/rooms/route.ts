import { apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { listVisualizerRooms } from "@/services/visualizer.service";

export async function GET(request: Request) {
  try {
    return Response.json({ data: await listVisualizerRooms(db) });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
