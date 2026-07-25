import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { deleteColor } from "@/lib/admin/catalog-service";

const colorSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).optional(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  toneFamily: z.string().trim().min(1).max(50),
  colorFamily: z.string().trim().min(1).max(50),
  collectionId: z.string().trim().min(1).nullable().optional(),
});

function serializeColor(color: {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  hex: string;
  toneFamily: string;
  colorFamily: string;
  collectionId: string | null;
  collection?: { id: string; name: string; nameEn: string | null } | null;
}) {
  return { ...color, nameEn: color.nameEn || color.name };
}

export async function GET() {
  try {
    await requireStaff();
    const colors = await db.paintColor.findMany({
      include: { collection: { select: { id: true, name: true, nameEn: true } } },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(colors.map(serializeColor));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = colorSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin màu không hợp lệ");
    const color = await db.paintColor.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        nameEn: parsed.data.nameEn,
        hex: parsed.data.hex,
        toneFamily: parsed.data.toneFamily,
        colorFamily: parsed.data.colorFamily,
        collectionId: parsed.data.collectionId || null,
      },
      include: { collection: { select: { id: true, name: true, nameEn: true } } },
    });
    await createAuditLog(db, {
      actor,
      action: "COLOR_CREATED",
      entityType: "PaintColor",
      entityId: color.id,
      afterData: { code: color.code, name: color.name, hex: color.hex },
    });
    return NextResponse.json(serializeColor(color), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = colorSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin màu không hợp lệ");
    }
    const color = await db.paintColor.update({
      where: { id: parsed.data.id },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        nameEn: parsed.data.nameEn,
        hex: parsed.data.hex,
        toneFamily: parsed.data.toneFamily,
        colorFamily: parsed.data.colorFamily,
        collectionId: parsed.data.collectionId || null,
      },
      include: { collection: { select: { id: true, name: true, nameEn: true } } },
    });
    await createAuditLog(db, {
      actor,
      action: "COLOR_UPDATED",
      entityType: "PaintColor",
      entityId: color.id,
      afterData: { code: color.code, name: color.name, hex: color.hex },
    });
    return NextResponse.json(serializeColor(color));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã màu");
    await deleteColor(db, actor, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
