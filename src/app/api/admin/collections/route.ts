import { z } from "zod";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const collectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().max(160).optional().or(z.literal("")),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  year: z.number().int().min(1900).max(2200),
  isActive: z.boolean().default(true),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function ensureUniqueSlug(slug: string, id?: string) {
  const existing = await db.colorCollection.findFirst({
    where: { slug, id: id ? { not: id } : undefined },
  });
  if (existing) throw new ApiError(409, "Slug bộ sưu tập đã tồn tại");
}

const includeColorCount = { _count: { select: { colors: true } } } as const;

export async function GET() {
  try {
    await requireStaff();
    const collections = await db.colorCollection.findMany({
      include: includeColorCount,
      orderBy: [{ year: "desc" }, { name: "asc" }],
    });
    return Response.json(collections);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = collectionSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin bộ sưu tập không hợp lệ");
    const slug = slugify(parsed.data.slug || parsed.data.name);
    if (!slug) throw new ApiError(400, "Slug bộ sưu tập không hợp lệ");
    await ensureUniqueSlug(slug);

    const collection = await db.colorCollection.create({
      data: {
        name: parsed.data.name,
        nameEn: parsed.data.nameEn || null,
        slug,
        description: parsed.data.description || null,
        image: parsed.data.image || null,
        year: parsed.data.year,
        isActive: parsed.data.isActive,
      },
      include: includeColorCount,
    });
    await createAuditLog(db, {
      actor,
      action: "COLLECTION_CREATED",
      entityType: "ColorCollection",
      entityId: collection.id,
      afterData: { name: collection.name, slug: collection.slug, year: collection.year },
    });
    return Response.json(collection, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = collectionSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin bộ sưu tập không hợp lệ");
    }
    const slug = slugify(parsed.data.slug || parsed.data.name);
    if (!slug) throw new ApiError(400, "Slug bộ sưu tập không hợp lệ");
    await ensureUniqueSlug(slug, parsed.data.id);

    const collection = await db.colorCollection.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        nameEn: parsed.data.nameEn || null,
        slug,
        description: parsed.data.description || null,
        image: parsed.data.image || null,
        year: parsed.data.year,
        isActive: parsed.data.isActive,
      },
      include: includeColorCount,
    });
    await createAuditLog(db, {
      actor,
      action: "COLLECTION_UPDATED",
      entityType: "ColorCollection",
      entityId: collection.id,
      afterData: { name: collection.name, slug: collection.slug, year: collection.year },
    });
    return Response.json(collection);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã bộ sưu tập");
    await db.colorCollection.update({ where: { id }, data: { isActive: false } });
    await createAuditLog(db, {
      actor,
      action: "COLLECTION_DEACTIVATED",
      entityType: "ColorCollection",
      entityId: id,
      afterData: { isActive: false },
    });
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
