import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";

const quoteSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  companyName: z.string().trim().max(180).optional().or(z.literal("")),
  projectName: z.string().trim().max(180).optional().or(z.literal("")),
  projectType: z.string().trim().max(100).default("Residential"),
  area: z.coerce.number().positive().max(10_000_000).optional(),
  paintType: z.string().trim().max(180).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(5000),
});

export async function POST(request: Request) {
  try {
    const parsed = quoteSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin yêu cầu báo giá không hợp lệ");
    const session = await auth();
    const customer = session?.user?.email
      ? await db.customer.findFirst({ where: { user: { email: session.user.email } } })
      : null;

    const created = await db.quoteRequest.create({
      data: {
        customerId: customer?.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        companyName: parsed.data.companyName || null,
        projectName: parsed.data.projectName || null,
        projectType: parsed.data.projectType,
        area: parsed.data.area || null,
        paintType: parsed.data.paintType || null,
        message: parsed.data.message,
      },
    });

    const staffs = await db.user.findMany({ where: { role: { type: { in: ["ADMIN", "STAFF"] } } }, select: { id: true } });
    if (staffs.length > 0) {
      await db.notification.createMany({
        data: staffs.map((s) => ({
          userId: s.id,
          type: "QUOTE",
          title: "Yêu cầu báo giá mới",
          message: `Khách hàng ${parsed.data.fullName} yêu cầu báo giá cho dự án ${parsed.data.projectType}.`,
        })),
      });
    }

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
