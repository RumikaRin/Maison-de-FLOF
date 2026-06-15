import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadSchema = z.object({
  dataUrl: z.string().startsWith("data:image/").max(12_000_000),
  fileName: z.string().trim().min(1).max(160),
});

function ensureConfigured() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new ApiError(503, "Cloudinary chưa được cấu hình");
  }
}

export async function GET() {
  try {
    await requireStaff();
    ensureConfigured();
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "flof/",
      resource_type: "image",
      max_results: 100,
    });
    return NextResponse.json(
      result.resources.map((resource: any) => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        createdAt: resource.created_at,
      })),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireStaff();
    ensureConfigured();
    const parsed = uploadSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Ảnh không hợp lệ hoặc vượt quá 8 MB");
    const safeName = parsed.data.fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .slice(0, 100);
    const result = await cloudinary.uploader.upload(parsed.data.dataUrl, {
      folder: "flof",
      public_id: `${safeName}-${Date.now().toString(36)}`,
      resource_type: "image",
    });
    return NextResponse.json(
      {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        createdAt: result.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requirePermission("MEDIA_DELETE");
    ensureConfigured();
    const publicId = new URL(request.url).searchParams.get("publicId");
    if (!publicId?.startsWith("flof/")) throw new ApiError(400, "Mã ảnh không hợp lệ");
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    await db.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "MEDIA_DELETED",
        entityType: "Media",
        entityId: publicId,
        beforeData: { publicId },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
