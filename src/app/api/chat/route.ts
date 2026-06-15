import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";

const chatMessageSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
  pageUrl: z.string().trim().max(500).optional().or(z.literal("")),
}).refine((data) => Boolean(data.phone || data.email), {
  message: "Vui lòng cung cấp số điện thoại hoặc email",
});

export async function POST(request: Request) {
  try {
    const parsed = chatMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Thông tin liên hệ không hợp lệ");
    }

    const message = await db.chatMessage.create({
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        email: parsed.data.email?.toLowerCase() || null,
        message: parsed.data.message,
        pageUrl: parsed.data.pageUrl || null,
      },
    });

    const staff = await db.user.findMany({
      where: { role: { type: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true },
    });
    if (staff.length > 0) {
      await db.notification.createMany({
        data: staff.map((user) => ({
          userId: user.id,
          type: "SYSTEM" as const,
          title: "Tin nhắn tư vấn mới",
          message: `${message.fullName}: ${message.message.slice(0, 140)}`,
        })),
      });
    }

    return Response.json({ success: true, id: message.id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
