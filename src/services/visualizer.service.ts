import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ApiError } from "@/lib/api-auth";

const paletteEntrySchema = z.object({
  zone: z.string().trim().min(1).max(40),
  colorCode: z.string().trim().min(1).max(40),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
});

const createDesignSchema = z.object({
  roomId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(80),
  palette: z.array(paletteEntrySchema).min(1).max(10),
});

const updateDesignSchema = createDesignSchema
  .pick({ name: true, roomId: true, palette: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No visualizer changes supplied",
  });

export type VisualizerDesignInput = z.input<typeof createDesignSchema>;
export type VisualizerDesignUpdate = z.input<typeof updateDesignSchema>;

function invalidDesign(message = "Thiết kế phối màu không hợp lệ") {
  return new ApiError(400, message);
}

function parseCreate(input: VisualizerDesignInput) {
  const result = createDesignSchema.safeParse(input);
  if (!result.success) throw invalidDesign(result.error.issues[0]?.message);
  return result.data;
}

function parseUpdate(input: VisualizerDesignUpdate) {
  const result = updateDesignSchema.safeParse(input);
  if (!result.success) throw invalidDesign(result.error.issues[0]?.message);
  return result.data;
}

async function requireActiveRoom(database: PrismaClient, roomId: string) {
  const room = await database.visualizerRoom.findFirst({
    where: { id: roomId, isActive: true },
    select: { id: true },
  });
  if (!room) throw new ApiError(404, "Không tìm thấy không gian phối màu");
}

export function listVisualizerRooms(database: PrismaClient) {
  return database.visualizerRoom.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      baseImage: true,
      isActive: true,
      sortOrder: true,
    },
  });
}

export function listVisualizerDesigns(database: PrismaClient, userId: string) {
  return database.visualizerDesign.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      room: {
        select: { id: true, slug: true, name: true, nameEn: true },
      },
    },
  });
}

export async function getVisualizerDesign(
  database: PrismaClient,
  userId: string,
  id: string,
) {
  const design = await database.visualizerDesign.findFirst({
    where: { id, userId },
    include: {
      room: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameEn: true,
          baseImage: true,
        },
      },
    },
  });
  if (!design) throw new ApiError(404, "Không tìm thấy thiết kế");
  return design;
}

export async function createVisualizerDesign(
  database: PrismaClient,
  userId: string,
  input: VisualizerDesignInput,
) {
  const data = parseCreate(input);
  await requireActiveRoom(database, data.roomId);
  return database.visualizerDesign.create({
    data: {
      userId,
      roomId: data.roomId,
      name: data.name,
      palette: data.palette,
    },
    include: {
      room: {
        select: { id: true, slug: true, name: true, nameEn: true },
      },
    },
  });
}

export async function updateVisualizerDesign(
  database: PrismaClient,
  userId: string,
  id: string,
  input: VisualizerDesignUpdate,
) {
  const data = parseUpdate(input);
  if (data.roomId) await requireActiveRoom(database, data.roomId);
  const updated = await database.visualizerDesign.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      roomId: data.roomId,
      palette: data.palette,
    },
  });
  if (updated.count !== 1) throw new ApiError(404, "Không tìm thấy thiết kế");
  return getVisualizerDesign(database, userId, id);
}

export async function deleteVisualizerDesign(
  database: PrismaClient,
  userId: string,
  id: string,
) {
  const deleted = await database.visualizerDesign.deleteMany({
    where: { id, userId },
  });
  if (deleted.count !== 1) throw new ApiError(404, "Không tìm thấy thiết kế");
  return { success: true as const };
}
