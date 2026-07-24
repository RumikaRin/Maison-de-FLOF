import { z } from "zod";
import { ApiError, apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const replySchema = z.object({
  id: z.string().min(1),
  adminReply: z.string().trim().max(2000),
});

function serializeReview(review: {
  id: string;
  rating: number;
  comment: string;
  adminReply: string | null;
  createdAt: Date;
  user: { name: string | null; email: string };
  paint: { name: string; sku: string };
}) {
  return {
    ...review,
    adminReply: review.adminReply || "",
    createdAt: review.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    await requireStaff();
    const reviews = await db.review.findMany({
      include: {
        user: { select: { name: true, email: true } },
        paint: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(reviews.map(serializeReview));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireStaff();
    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Phản hồi không hợp lệ");
    const review = await db.review.update({
      where: { id: parsed.data.id },
      data: { adminReply: parsed.data.adminReply || null },
      include: {
        user: { select: { name: true, email: true } },
        paint: { select: { name: true, sku: true } },
      },
    });
    await createAuditLog(db, {
      actor,
      action: "REVIEW_REPLIED",
      entityType: "Review",
      entityId: review.id,
      afterData: { hasAdminReply: Boolean(review.adminReply) },
    });
    return Response.json(serializeReview(review));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireStaff();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã đánh giá");
    await db.review.delete({ where: { id } });
    await createAuditLog(db, {
      actor,
      action: "REVIEW_DELETED",
      entityType: "Review",
      entityId: id,
    });
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
