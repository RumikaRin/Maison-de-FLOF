import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  uploadImageToBlob,
  listBlobImages,
  deleteBlobImage,
} from "@/lib/storage/blob-storage";

const uploadSchema = z.object({
  dataUrl: z.string().startsWith("data:image/").max(12_000_000),
  fileName: z.string().trim().min(1).max(160),
});

export async function GET() {
  try {
    await requireStaff();
    const resources = await listBlobImages("flof/");
    return NextResponse.json(resources);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireStaff();
    const parsed = uploadSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Ảnh không hợp lệ hoặc vượt quá 8 MB");

    const result = await uploadImageToBlob({
      fileName: parsed.data.fileName,
      dataUrlOrBuffer: parsed.data.dataUrl,
      folder: "flof",
    });

    await createAuditLog(db, {
      actor,
      action: "MEDIA_UPLOADED",
      entityType: "Media",
      entityId: result.publicId,
      afterData: {
        publicId: result.publicId,
        url: result.url,
        createdAt: result.createdAt,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requirePermission("MEDIA_DELETE");
    const publicId = new URL(request.url).searchParams.get("publicId");
    if (!publicId) throw new ApiError(400, "Mã ảnh không hợp lệ");

    await deleteBlobImage(publicId);

    await createAuditLog(db, {
      actor: admin,
      action: "MEDIA_DELETED",
      entityType: "Media",
      entityId: publicId,
      beforeData: { publicId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
