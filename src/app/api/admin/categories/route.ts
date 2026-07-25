import { z } from "zod";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  createCategory,
  deactivateCategory,
  updateCategory,
} from "@/lib/admin/catalog-service";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().max(160).optional().or(z.literal("")),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function GET() {
  try {
    await requireStaff();
    const categories = await db.category.findMany({
      include: { _count: { select: { paints: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return Response.json(categories);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin danh mục không hợp lệ");
    const slug = slugify(parsed.data.slug || parsed.data.name);
    if (!slug) throw new ApiError(400, "Slug danh mục không hợp lệ");
    const category = await createCategory(db, actor, {
      name: parsed.data.name,
      nameEn: parsed.data.nameEn || null,
      slug,
      description: parsed.data.description || null,
      image: parsed.data.image || null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });
    return Response.json(category, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin danh mục không hợp lệ");
    }
    const slug = slugify(parsed.data.slug || parsed.data.name);
    const category = await updateCategory(db, actor, {
      id: parsed.data.id,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn || null,
      slug,
      description: parsed.data.description || null,
      image: parsed.data.image || null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });
    return Response.json(category);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã danh mục");
    await deactivateCategory(db, actor, id);
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
