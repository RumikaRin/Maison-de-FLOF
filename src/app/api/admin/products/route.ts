import { NextRequest, NextResponse } from "next/server";
import { PaintFinish, PaintType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import {
  createProduct,
  deactivateProduct,
  updateProduct,
} from "@/lib/admin/catalog-service";

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

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("CATALOG_MANAGE");
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin sản phẩm không hợp lệ");
    const product = await createProduct(db, admin, {
      ...parsed.data,
      colorCodes: parsed.data.colors,
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
    const product = await updateProduct(db, admin, {
      ...parsed.data,
      id: parsed.data.id,
      colorCodes: parsed.data.colors,
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
    await deactivateProduct(db, admin, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
