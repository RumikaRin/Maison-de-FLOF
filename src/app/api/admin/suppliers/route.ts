import { z } from "zod";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  contact: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
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
  const existing = await db.supplier.findFirst({
    where: { slug, id: id ? { not: id } : undefined },
  });
  if (existing) throw new ApiError(409, "Slug nhà cung cấp đã tồn tại");
}

const nullable = (value?: string) => value || null;

export async function GET() {
  try {
    await requireStaff();
    const suppliers = await db.supplier.findMany({
      include: { _count: { select: { paints: true, dealers: true } } },
      orderBy: { name: "asc" },
    });
    return Response.json(suppliers);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = supplierSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin nhà cung cấp không hợp lệ");
    const slug = slugify(parsed.data.slug || parsed.data.name);
    if (!slug) throw new ApiError(400, "Slug nhà cung cấp không hợp lệ");
    await ensureUniqueSlug(slug);
    const supplier = await db.supplier.create({
      data: {
        name: parsed.data.name,
        slug,
        website: nullable(parsed.data.website),
        phone: nullable(parsed.data.phone),
        email: nullable(parsed.data.email),
        address: nullable(parsed.data.address),
        contact: nullable(parsed.data.contact),
        description: nullable(parsed.data.description),
        isActive: parsed.data.isActive,
      },
      include: { _count: { select: { paints: true, dealers: true } } },
    });
    await createAuditLog(db, {
      actor,
      action: "SUPPLIER_CREATED",
      entityType: "Supplier",
      entityId: supplier.id,
      afterData: { name: supplier.name, slug: supplier.slug, isActive: supplier.isActive },
    });
    return Response.json(supplier, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = supplierSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin nhà cung cấp không hợp lệ");
    }
    const slug = slugify(parsed.data.slug || parsed.data.name);
    await ensureUniqueSlug(slug, parsed.data.id);
    const supplier = await db.supplier.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug,
        website: nullable(parsed.data.website),
        phone: nullable(parsed.data.phone),
        email: nullable(parsed.data.email),
        address: nullable(parsed.data.address),
        contact: nullable(parsed.data.contact),
        description: nullable(parsed.data.description),
        isActive: parsed.data.isActive,
      },
      include: { _count: { select: { paints: true, dealers: true } } },
    });
    await createAuditLog(db, {
      actor,
      action: "SUPPLIER_UPDATED",
      entityType: "Supplier",
      entityId: supplier.id,
      afterData: { name: supplier.name, slug: supplier.slug, isActive: supplier.isActive },
    });
    return Response.json(supplier);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã nhà cung cấp");
    await db.supplier.update({ where: { id }, data: { isActive: false } });
    await createAuditLog(db, {
      actor,
      action: "SUPPLIER_DEACTIVATED",
      entityType: "Supplier",
      entityId: id,
      afterData: { isActive: false },
    });
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
