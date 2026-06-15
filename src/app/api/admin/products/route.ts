import { NextRequest, NextResponse } from "next/server";
import { PaintFinish, PaintType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().min(2).max(200),
  categoryId: z.string().min(1),
  supplierId: z.string().min(1),
  description: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  paintType: z.nativeEnum(PaintType),
  finish: z.nativeEnum(PaintFinish),
  volume: z.number().positive(),
  volumeUnit: z.string().trim().min(1).max(20),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().optional(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  stock: z.number().int().nonnegative(),
  colors: z.array(z.string()).default([]),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function serializeProduct(product: any) {
  return {
    ...product,
    nameEn: product.nameEn || product.name,
    description: product.description || "",
    descriptionEn: product.descriptionEn || product.description || "",
    features: product.features || "",
    featuresEn: product.featuresEn || "",
    application: product.application || "",
    specifications: product.specifications || "",
    dryingTime: product.dryingTime || "",
    supplierId: product.supplierId || "",
    price: Number(product.price),
    costPrice: Number(product.costPrice),
    coverage: product.coverage ? Number(product.coverage) : 0,
    volume: Number(product.volume),
    colors: product.colors.map((link: any) => link.color.code),
  };
}

const includeProductRelations = {
  colors: { include: { color: true } },
} as const;

export async function GET() {
  try {
    await requireStaff();
    const [products, categories, suppliers, colors] = await Promise.all([
      db.paint.findMany({
        where: { isActive: true },
        include: includeProductRelations,
        orderBy: { createdAt: "desc" },
      }),
      db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      db.paintColor.findMany({ orderBy: { code: "asc" } }),
    ]);
    return NextResponse.json({
      products: products.map(serializeProduct),
      categories,
      suppliers,
      colors: colors.map((color) => ({ ...color, nameEn: color.nameEn || color.name })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function resolveColorIds(codes: string[]) {
  if (!codes.length) return [];
  const colors = await db.paintColor.findMany({
    where: { code: { in: codes } },
    select: { id: true },
  });
  if (colors.length !== [...new Set(codes)].length) {
    throw new ApiError(400, "Một hoặc nhiều mã màu không tồn tại");
  }
  return colors.map((color) => color.id);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("CATALOG_MANAGE");
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin sản phẩm không hợp lệ");
    const colorIds = await resolveColorIds(parsed.data.colors);
    const product = await db.$transaction(async (tx) => {
      const created = await tx.paint.create({
        data: {
          sku: parsed.data.sku,
          name: parsed.data.name,
          nameEn: parsed.data.nameEn,
          slug: `${slugify(parsed.data.name)}-${Date.now().toString(36)}`,
          categoryId: parsed.data.categoryId,
          supplierId: parsed.data.supplierId,
          description: parsed.data.description,
          descriptionEn: parsed.data.descriptionEn,
          paintType: parsed.data.paintType,
          finish: parsed.data.finish,
          surfaces: ["WALL"],
          volume: parsed.data.volume,
          volumeUnit: parsed.data.volumeUnit,
          price: parsed.data.price,
          costPrice: parsed.data.costPrice ?? parsed.data.price * 0.6,
          discountPercent: parsed.data.discountPercent,
          stock: parsed.data.stock,
          images: ["/product_interior.png"],
          colors: { create: colorIds.map((colorId) => ({ colorId })) },
        },
        include: includeProductRelations,
      });
      if (parsed.data.stock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            paintId: created.id,
            type: "IMPORT",
            quantity: parsed.data.stock,
            reason: "Tồn kho ban đầu khi tạo sản phẩm",
          },
        });
      }
      await createAuditLog(tx, {
        actor: admin,
        action: "PRODUCT_CREATED",
        entityType: "Paint",
        entityId: created.id,
        afterData: { sku: created.sku, name: created.name, stock: created.stock },
      });
      return created;
    });
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requirePermission("CATALOG_MANAGE");
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin sản phẩm không hợp lệ");
    }
    const colorIds = await resolveColorIds(parsed.data.colors);
    const existing = await db.paint.findUnique({ where: { id: parsed.data.id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy sản phẩm");
    const product = await db.$transaction(async (tx) => {
      const updated = await tx.paint.update({
        where: { id: parsed.data.id },
        data: {
          sku: parsed.data.sku,
          name: parsed.data.name,
          nameEn: parsed.data.nameEn,
          categoryId: parsed.data.categoryId,
          supplierId: parsed.data.supplierId,
          description: parsed.data.description,
          descriptionEn: parsed.data.descriptionEn,
          paintType: parsed.data.paintType,
          finish: parsed.data.finish,
          volume: parsed.data.volume,
          volumeUnit: parsed.data.volumeUnit,
          price: parsed.data.price,
          discountPercent: parsed.data.discountPercent,
          colors: {
            deleteMany: {},
            create: colorIds.map((colorId) => ({ colorId })),
          },
        },
        include: includeProductRelations,
      });
      await createAuditLog(tx, {
        actor: admin,
        action: "PRODUCT_UPDATED",
        entityType: "Paint",
        entityId: updated.id,
        beforeData: { sku: existing.sku, name: existing.name, price: Number(existing.price) },
        afterData: { sku: updated.sku, name: updated.name, price: Number(updated.price) },
      });
      return updated;
    });
    return NextResponse.json(serializeProduct(product));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã sản phẩm");
    await db.$transaction(async (tx) => {
      const product = await tx.paint.update({ where: { id }, data: { isActive: false } });
      await createAuditLog(tx, {
        actor: admin,
        action: "PRODUCT_DEACTIVATED",
        entityType: "Paint",
        entityId: product.id,
        beforeData: { isActive: true },
        afterData: { isActive: false },
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
