import { z } from "zod";
import { ApiError, apiErrorResponse, requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

const favoriteProductSchema = z.object({
  paintId: z.string().min(1),
});

const productSelect = {
  id: true,
  slug: true,
  name: true,
  nameEn: true,
  price: true,
  discountPercent: true,
  images: true,
  stock: true,
} as const;

function serializeProduct(product: {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  price: { toString(): string };
  discountPercent: number;
  images: string[];
  stock: number;
}) {
  return {
    ...product,
    nameEn: product.nameEn || product.name,
    price: Number(product.price),
  };
}

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const wishlists = await db.wishlist.findMany({
      where: { customer: { user: { email: sessionUser.email } } },
      include: { paint: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(wishlists.map((wishlist) => serializeProduct(wishlist.paint)));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireUser();
    const parsed = favoriteProductSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Sản phẩm không hợp lệ");

    const [user, paint] = await Promise.all([
      db.user.findUnique({ where: { email: sessionUser.email }, include: { customer: true } }),
      db.paint.findFirst({ where: { id: parsed.data.paintId, isActive: true }, select: productSelect }),
    ]);
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
    if (!paint) throw new ApiError(404, "Không tìm thấy sản phẩm");
    const customer = user.customer ?? await db.customer.create({ data: { userId: user.id } });
    const existing = await db.wishlist.findUnique({
      where: { customerId_paintId: { customerId: customer.id, paintId: paint.id } },
    });

    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return Response.json({ favorited: false, paintId: paint.id });
    }
    await db.wishlist.upsert({
      where: { customerId_paintId: { customerId: customer.id, paintId: paint.id } },
      update: {},
      create: { customerId: customer.id, paintId: paint.id },
    });
    return Response.json({ favorited: true, paint: serializeProduct(paint) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
