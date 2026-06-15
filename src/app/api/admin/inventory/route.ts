import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const importSchema = z.object({
  paintId: z.string().min(1),
  quantity: z.number().int().min(1).max(100_000),
  costPrice: z.number().nonnegative(),
  reason: z.string().trim().max(500).optional(),
});

function serializePaint(paint: {
  id: string;
  sku: string;
  name: string;
  nameEn: string | null;
  price: { toString(): string };
  costPrice: { toString(): string };
  volume: { toString(): string };
  volumeUnit: string;
  stock: number;
  minStock: number;
  supplier: { name: string } | null;
}) {
  return {
    id: paint.id,
    sku: paint.sku,
    name: paint.name,
    nameEn: paint.nameEn || paint.name,
    price: Number(paint.price),
    costPrice: Number(paint.costPrice),
    volume: Number(paint.volume),
    volumeUnit: paint.volumeUnit,
    stock: paint.stock,
    minStock: paint.minStock,
    supplier: paint.supplier?.name || "",
  };
}

export async function GET() {
  try {
    await requireStaff();
    const [paints, transactions] = await Promise.all([
      db.paint.findMany({
        where: { isActive: true },
        include: { supplier: true },
        orderBy: { name: "asc" },
      }),
      db.inventoryTransaction.findMany({
        where: { type: "IMPORT" },
        include: { paint: { include: { supplier: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      paints: paints.map(serializePaint),
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.createdAt.toISOString().replace("T", " ").slice(0, 16),
        paintId: transaction.paintId,
        paintName: transaction.paint.name,
        sku: transaction.paint.sku,
        quantity: transaction.quantity,
        importPrice: Number(transaction.paint.costPrice),
        supplier: transaction.paint.supplier?.name || "",
        reason: transaction.reason || "",
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requirePermission("INVENTORY_IMPORT");
    const parsed = importSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Dữ liệu nhập kho không hợp lệ");
    }

    const { paintId, quantity, costPrice, reason } = parsed.data;
    const result = await db.$transaction(async (tx) => {
      const paint = await tx.paint.findUnique({
        where: { id: paintId },
        include: { supplier: true },
      });
      if (!paint) throw new ApiError(404, "Không tìm thấy sản phẩm");

      const updatedPaint = await tx.paint.update({
        where: { id: paintId },
        data: {
          stock: { increment: quantity },
          costPrice,
        },
        include: { supplier: true },
      });
      const transaction = await tx.inventoryTransaction.create({
        data: {
          paintId,
          type: "IMPORT",
          quantity,
          reason: reason || "Nhập hàng bổ sung kho",
        },
      });
      await createAuditLog(tx, {
        actor: staff,
        action: "INVENTORY_IMPORTED",
        entityType: "Paint",
        entityId: paintId,
        beforeData: { stock: paint.stock, costPrice: Number(paint.costPrice) },
        afterData: { stock: updatedPaint.stock, costPrice },
      });

      return { paint: updatedPaint, transaction };
    });

    return NextResponse.json(
      {
        paint: serializePaint(result.paint),
        transaction: {
          id: result.transaction.id,
          date: result.transaction.createdAt.toISOString().replace("T", " ").slice(0, 16),
          paintId: result.paint.id,
          paintName: result.paint.name,
          sku: result.paint.sku,
          quantity,
          importPrice: costPrice,
          supplier: result.paint.supplier?.name || "",
          reason: result.transaction.reason || "",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
