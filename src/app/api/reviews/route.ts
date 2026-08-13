import { z } from "zod";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { submitVerifiedReview } from "@/lib/customer-workflow-service";

const reviewSchema = z.object({
  paintId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000),
});

function serializeReview(review: {
  id: string;
  rating: number;
  comment: string;
  adminReply: string | null;
  createdAt: Date;
  user: { name: string | null };
}) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    adminReply: review.adminReply || "",
    author: review.user.name || "Khách hàng",
    createdAt: review.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const paintId = new URL(request.url).searchParams.get("paintId");
    if (!paintId) throw new ApiError(400, "Thiếu mã sản phẩm");
    const reviews = await db.review.findMany({
      where: { paintId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(reviews.map(serializeReview));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireUser();
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Đánh giá không hợp lệ");
    const review = await submitVerifiedReview(
      db,
      sessionUser.id,
      parsed.data,
    );
    return Response.json(serializeReview(review), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
