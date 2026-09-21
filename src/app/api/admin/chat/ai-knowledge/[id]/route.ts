import { z } from "zod";
import { apiErrorResponse, requireAdmin, ApiError } from "@/lib/api-auth";
import {
  toggleKnowledgeDocumentActive,
  deleteKnowledgeDocument,
} from "@/lib/chat/ai-knowledge-service";

const patchSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Trường isActive phải là giá trị boolean.");
    }

    const updated = await toggleKnowledgeDocumentActive(id, parsed.data.isActive);
    if (!updated) {
      throw new ApiError(404, "Không tìm thấy tài liệu cần cập nhật.");
    }

    return Response.json({
      success: true,
      document: updated,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const deleted = await deleteKnowledgeDocument(id);
    if (!deleted) {
      throw new ApiError(404, "Không tìm thấy tài liệu cần xóa.");
    }

    return Response.json({
      success: true,
      message: "Đã xóa tài liệu khỏi cơ sở tri thức AI thành công.",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
