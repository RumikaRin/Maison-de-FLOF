import { db } from "@/lib/db";

export async function GET() {
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, logo: true, website: true },
    orderBy: { name: "asc" },
  });
  return Response.json(suppliers);
}
