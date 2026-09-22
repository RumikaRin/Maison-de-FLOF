import { apiErrorResponse, requireStaff, requireAdmin, ApiError } from "@/lib/api-auth";
import {
  getKnowledgeDocuments,
  addKnowledgeDocument,
} from "@/lib/chat/ai-knowledge-service";
import { getCatalogStats } from "@/lib/chat/ai-catalog-knowledge";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".docx", ".txt", ".md", ".json"];

export async function GET() {
  try {
    await requireStaff();
    const [documents, stats] = await Promise.all([
      getKnowledgeDocuments(),
      getCatalogStats(),
    ]);

    return Response.json({
      success: true,
      documents,
      catalogStats: stats,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ApiError(400, "Vui lòng chọn một tệp hợp lệ để tải lên.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(400, "Kích thước tệp vượt quá giới hạn tối đa cho phép (10MB).");
    }

    const filename = file.name;
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ApiError(
        400,
        `Định dạng tệp "${ext}" không được hỗ trợ. Vui lòng tải lên file Excel (.xlsx, .xls, .csv), Word (.docx), hoặc Văn bản (.txt, .md).`,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const document = await addKnowledgeDocument(filename, buffer);

    return Response.json(
      {
        success: true,
        document,
        message: `Đã phân tích và lưu tài liệu "${filename}" thành công.`,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
