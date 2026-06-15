import { db } from "@/lib/db";

export async function GET() {
  const collections = await db.colorCollection.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      nameEn: true,
      slug: true,
      description: true,
      image: true,
      year: true,
      colors: {
        select: {
          id: true,
          code: true,
          name: true,
          nameEn: true,
          hex: true,
          toneFamily: true,
          colorFamily: true,
        },
        orderBy: { code: "asc" },
      },
    },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return Response.json(collections);
}
