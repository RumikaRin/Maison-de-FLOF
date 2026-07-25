import type {
  PaintFinish,
  PaintType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { ApiError } from "@/lib/api-auth";

export type AuditActor = {
  id: string;
  email: string;
};

export type CategoryCreateInput = {
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryUpdateInput = CategoryCreateInput & {
  id: string;
};

export type ProductCreateInput = {
  sku: string;
  name: string;
  nameEn: string;
  categoryId: string;
  supplierId: string;
  description?: string;
  descriptionEn?: string;
  paintType: PaintType;
  finish: PaintFinish;
  volume: number;
  volumeUnit: string;
  price: number;
  costPrice?: number;
  discountPercent: number;
  stock: number;
  colorCodes: string[];
};

export type ProductUpdateInput = ProductCreateInput & {
  id: string;
};

const categoryWithPaintCount = {
  _count: { select: { paints: true } },
} as const;

export function createCategory(
  database: PrismaClient,
  actor: AuditActor,
  input: CategoryCreateInput,
) {
  return database.$transaction(async (tx) => {
    const existing = await tx.category.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing) throw new ApiError(409, "Slug danh mục đã tồn tại");

    const category = await tx.category.create({
      data: input,
      include: categoryWithPaintCount,
    });
    await createAuditLog(tx, {
      actor,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      afterData: {
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
      },
    });
    return category;
  });
}

export function updateCategory(
  database: PrismaClient,
  actor: AuditActor,
  input: CategoryUpdateInput,
) {
  return database.$transaction(async (tx) => {
    const existingSlug = await tx.category.findFirst({
      where: {
        slug: input.slug,
        id: { not: input.id },
      },
      select: { id: true },
    });
    if (existingSlug) throw new ApiError(409, "Slug danh mục đã tồn tại");

    const category = await tx.category.update({
      where: { id: input.id },
      data: {
        name: input.name,
        nameEn: input.nameEn,
        slug: input.slug,
        description: input.description,
        image: input.image,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: categoryWithPaintCount,
    });
    await createAuditLog(tx, {
      actor,
      action: "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: category.id,
      afterData: {
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
      },
    });
    return category;
  });
}

export function deactivateCategory(
  database: PrismaClient,
  actor: AuditActor,
  id: string,
) {
  return database.$transaction(async (tx) => {
    await tx.category.update({
      where: { id },
      data: { isActive: false },
    });
    await createAuditLog(tx, {
      actor,
      action: "CATEGORY_DEACTIVATED",
      entityType: "Category",
      entityId: id,
      afterData: { isActive: false },
    });
  });
}

const productWithColors = {
  colors: { include: { color: true } },
} as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolveColorIds(
  tx: Prisma.TransactionClient,
  codes: string[],
) {
  const uniqueCodes = [...new Set(codes)];
  if (uniqueCodes.length === 0) return [];
  const colors = await tx.paintColor.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true },
  });
  if (colors.length !== uniqueCodes.length) {
    throw new ApiError(400, "Một hoặc nhiều mã màu không tồn tại");
  }
  return colors.map(({ id }) => id);
}

export function createProduct(
  database: PrismaClient,
  actor: AuditActor,
  input: ProductCreateInput,
) {
  return database.$transaction(async (tx) => {
    const duplicate = await tx.paint.findUnique({
      where: { sku: input.sku },
      select: { id: true },
    });
    if (duplicate) throw new ApiError(409, "Mã SKU đã tồn tại");
    const colorIds = await resolveColorIds(tx, input.colorCodes);
    const created = await tx.paint.create({
      data: {
        sku: input.sku,
        name: input.name,
        nameEn: input.nameEn,
        slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
        categoryId: input.categoryId,
        supplierId: input.supplierId,
        description: input.description,
        descriptionEn: input.descriptionEn,
        paintType: input.paintType,
        finish: input.finish,
        surfaces: ["WALL"],
        volume: input.volume,
        volumeUnit: input.volumeUnit,
        price: input.price,
        costPrice: input.costPrice ?? input.price * 0.6,
        discountPercent: input.discountPercent,
        stock: input.stock,
        images: ["/product_interior.webp"],
        colors: {
          create: colorIds.map((colorId) => ({ colorId })),
        },
      },
      include: productWithColors,
    });
    if (input.stock > 0) {
      await tx.inventoryTransaction.create({
        data: {
          paintId: created.id,
          type: "IMPORT",
          quantity: input.stock,
          reason: "Tồn kho ban đầu khi tạo sản phẩm",
          referenceType: "IMPORT",
        },
      });
    }
    await createAuditLog(tx, {
      actor,
      action: "PRODUCT_CREATED",
      entityType: "Paint",
      entityId: created.id,
      afterData: {
        sku: created.sku,
        name: created.name,
        stock: created.stock,
      },
    });
    return created;
  });
}

export function updateProduct(
  database: PrismaClient,
  actor: AuditActor,
  input: ProductUpdateInput,
) {
  return database.$transaction(async (tx) => {
    const existing = await tx.paint.findUnique({ where: { id: input.id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy sản phẩm");
    const duplicate = await tx.paint.findFirst({
      where: { sku: input.sku, id: { not: input.id } },
      select: { id: true },
    });
    if (duplicate) throw new ApiError(409, "Mã SKU đã tồn tại");
    const colorIds = await resolveColorIds(tx, input.colorCodes);
    const updated = await tx.paint.update({
      where: { id: input.id },
      data: {
        sku: input.sku,
        name: input.name,
        nameEn: input.nameEn,
        categoryId: input.categoryId,
        supplierId: input.supplierId,
        description: input.description,
        descriptionEn: input.descriptionEn,
        paintType: input.paintType,
        finish: input.finish,
        volume: input.volume,
        volumeUnit: input.volumeUnit,
        price: input.price,
        discountPercent: input.discountPercent,
        colors: {
          deleteMany: {},
          create: colorIds.map((colorId) => ({ colorId })),
        },
      },
      include: productWithColors,
    });
    await createAuditLog(tx, {
      actor,
      action: "PRODUCT_UPDATED",
      entityType: "Paint",
      entityId: updated.id,
      beforeData: {
        sku: existing.sku,
        name: existing.name,
        price: Number(existing.price),
      },
      afterData: {
        sku: updated.sku,
        name: updated.name,
        price: Number(updated.price),
      },
    });
    return updated;
  });
}

export function deactivateProduct(
  database: PrismaClient,
  actor: AuditActor,
  id: string,
) {
  return database.$transaction(async (tx) => {
    const product = await tx.paint.update({
      where: { id },
      data: { isActive: false },
    });
    await createAuditLog(tx, {
      actor,
      action: "PRODUCT_DEACTIVATED",
      entityType: "Paint",
      entityId: product.id,
      beforeData: { isActive: true },
      afterData: { isActive: false },
    });
  });
}

export function deleteColor(
  database: PrismaClient,
  actor: AuditActor,
  id: string,
) {
  return database.$transaction(async (tx) => {
    const linked = await tx.paintColorLink.count({ where: { colorId: id } });
    if (linked > 0) {
      throw new ApiError(409, "Không thể xóa màu đang được gắn với sản phẩm");
    }
    await tx.paintColor.delete({ where: { id } });
    await createAuditLog(tx, {
      actor,
      action: "COLOR_DELETED",
      entityType: "PaintColor",
      entityId: id,
    });
  });
}
