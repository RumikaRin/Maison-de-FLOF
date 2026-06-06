import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const dbDealers = await db.dealer.findMany({
      where: { isActive: true },
      include: { supplier: true }
    });

    const adapted = dbDealers.map((d) => ({
      id: d.id,
      name: d.name,
      nameEn: d.name,
      phone: d.phone,
      email: d.email || "",
      address: d.address,
      addressEn: d.address,
      province: d.province,
      district: d.district,
      brand: d.supplier?.name || "Jotun",
      lng: d.longitude ? Number(d.longitude) : 105.8016,
      lat: d.latitude ? Number(d.latitude) : 21.0267
    }));

    return NextResponse.json(adapted);
  } catch (error) {
    console.error("Failed to fetch dealers:", error);
    return NextResponse.json([]);
  }
}
