import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const updateQuoteSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONTACTED", "QUOTED", "CLOSED"]),
  adminNote: z.string().trim().max(2000).optional(),
});

function serializeQuote(quote: {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  companyName: string | null;
  projectName: string | null;
  projectType: string;
  area: { toString(): string } | null;
  paintType: string | null;
  message: string;
  status: "PENDING" | "CONTACTED" | "QUOTED" | "CLOSED";
  adminNote: string | null;
  createdAt: Date;
}) {
  return {
    ...quote,
    area: quote.area ? Number(quote.area) : null,
    adminNote: quote.adminNote || "",
    createdAt: quote.createdAt.toISOString().split("T")[0],
  };
}

export async function GET() {
  try {
    await requireStaff();
    const quotes = await db.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes.map(serializeQuote));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireStaff();
    const parsed = updateQuoteSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Dữ liệu báo giá không hợp lệ");

    const quote = await db.quoteRequest.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote || null,
      },
    });
    await createAuditLog(db, {
      actor,
      action: "QUOTE_STATUS_CHANGED",
      entityType: "QuoteRequest",
      entityId: quote.id,
      afterData: { status: quote.status, hasAdminNote: Boolean(quote.adminNote) },
    });
    return NextResponse.json(serializeQuote(quote));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
