import type { PrismaClient } from "@prisma/client";
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
