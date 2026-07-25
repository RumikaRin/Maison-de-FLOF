import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, apiErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createQuoteRequest } from "@/lib/customer-workflow-service";

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

    const created = await createQuoteRequest(db, customer?.id || null, {
      ...parsed.data,
      companyName: parsed.data.companyName || null,
      projectName: parsed.data.projectName || null,
      paintType: parsed.data.paintType || null,
    });
    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
