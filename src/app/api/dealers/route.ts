import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination, PaginationError } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = await rateLimit(request);
    if (!rateLimitRes.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const {
      page,
      limit,
      requested: isPaginationRequested,
    } = parsePagination(searchParams);

    const queryOptions: any = {
      where: { isActive: true },
      include: { supplier: { select: { name: true } } }
    };

    if (isPaginationRequested) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const [dbDealers, total] = await Promise.all([
      db.dealer.findMany(queryOptions) as Promise<any[]>,
      isPaginationRequested ? db.dealer.count({ where: { isActive: true } }) : Promise.resolve(0)
    ]);

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

    if (isPaginationRequested) {
      return NextResponse.json({
        data: adapted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    return NextResponse.json(adapted, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    if (error instanceof PaginationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to fetch dealers:", error);
    return NextResponse.json([]);
  }
}
