import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const dealerSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(3).max(255),
  province: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(120),
  brand: z.string().trim().max(120).optional(),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

function serializeDealer(dealer: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  province: string;
  district: string;
  longitude: { toString(): string } | null;
  latitude: { toString(): string } | null;
  supplier: { name: string } | null;
}) {
  return {
    id: dealer.id,
    name: dealer.name,
    nameEn: dealer.name,
    phone: dealer.phone,
    email: dealer.email || "",
    address: dealer.address,
    addressEn: dealer.address,
    province: dealer.province,
    district: dealer.district,
    brand: dealer.supplier?.name || "",
    lng: dealer.longitude ? Number(dealer.longitude) : 0,
    lat: dealer.latitude ? Number(dealer.latitude) : 0,
  };
}

async function supplierIdForBrand(brand?: string) {
  if (!brand) return null;
  const supplier = await db.supplier.findFirst({
    where: { name: { equals: brand, mode: "insensitive" } },
  });
  return supplier?.id || null;
}

export async function GET() {
  try {
    await requireStaff();
    const dealers = await db.dealer.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(dealers.map(serializeDealer));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = dealerSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin đại lý không hợp lệ");
    const dealer = await db.dealer.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        address: parsed.data.address,
        province: parsed.data.province,
        district: parsed.data.district,
        longitude: parsed.data.lng,
        latitude: parsed.data.lat,
        supplierId: await supplierIdForBrand(parsed.data.brand),
      },
      include: { supplier: true },
    });
    await createAuditLog(db, {
      actor,
      action: "DEALER_CREATED",
      entityType: "Dealer",
      entityId: dealer.id,
      afterData: { name: dealer.name, province: dealer.province, district: dealer.district },
    });
    return NextResponse.json(serializeDealer(dealer), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const parsed = dealerSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin đại lý không hợp lệ");
    }
    const dealer = await db.dealer.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        address: parsed.data.address,
        province: parsed.data.province,
        district: parsed.data.district,
        longitude: parsed.data.lng,
        latitude: parsed.data.lat,
        supplierId: await supplierIdForBrand(parsed.data.brand),
      },
      include: { supplier: true },
    });
    await createAuditLog(db, {
      actor,
      action: "DEALER_UPDATED",
      entityType: "Dealer",
      entityId: dealer.id,
      afterData: { name: dealer.name, province: dealer.province, district: dealer.district },
    });
    return NextResponse.json(serializeDealer(dealer));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã đại lý");
    await db.dealer.delete({ where: { id } });
    await createAuditLog(db, {
      actor,
      action: "DEALER_DELETED",
      entityType: "Dealer",
      entityId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
