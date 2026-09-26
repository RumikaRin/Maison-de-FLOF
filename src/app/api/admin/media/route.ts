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
  dataUrl: z
    .string()
    .startsWith("data:image/")
    .max(12_000_000)
    .refine((val) => !val.startsWith("data:image/svg+xml"), "Không hỗ trợ tệp SVG"),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .refine((name) => !name.toLowerCase().endsWith(".svg"), "Không hỗ trợ tệp SVG"),
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
    let fileName: string;
    let fileBuffer: Buffer | string;
    let mimeType: string | undefined;

    const reqContentType = request.headers.get("content-type") || "";
    if (reqContentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        throw new ApiError(400, "Vui lòng chọn tệp ảnh để tải lên");
      }
      if (
        !file.type.startsWith("image/") ||
        file.type === "image/svg+xml" ||
        file.name.toLowerCase().endsWith(".svg")
      ) {
        throw new ApiError(400, "Tệp tải lên phải là định dạng hình ảnh và không hỗ trợ SVG");
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new ApiError(400, "Dung lượng ảnh không được vượt quá 8 MB");
      }
      fileName = file.name || "image.png";
      mimeType = file.type;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      const parsed = uploadSchema.safeParse(await request.json());
      if (!parsed.success) throw new ApiError(400, "Ảnh không hợp lệ hoặc vượt quá 8 MB");
      fileName = parsed.data.fileName;
      fileBuffer = parsed.data.dataUrl;
    }

    const result = await uploadImageToBlob({
      fileName,
      dataUrlOrBuffer: fileBuffer,
      contentType: mimeType,
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
    if (!publicId || (!publicId.startsWith("flof/") && !publicId.includes("/flof/"))) {
      throw new ApiError(400, "Mã ảnh không hợp lệ hoặc nằm ngoài phạm vi cho phép");
    }

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
