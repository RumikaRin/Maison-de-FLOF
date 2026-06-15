import { z } from "zod";
import { db } from "@/lib/db";
import { apiErrorResponse, requireUser } from "@/lib/api-auth";

const favoriteSchema = z.object({
  code: z.string().trim().min(1).max(32),
});

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const user = await db.user.findUnique({
      where: { email: sessionUser.email },
      include: {
        customer: {
          include: {
            wishlistColors: {
              include: { color: true },
            },
          },
        },
      },
    });

    return Response.json(user?.customer?.wishlistColors.map((item) => item.color.code) ?? []);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireUser();
    const { code } = favoriteSchema.parse(await request.json());

    const [user, paintColor] = await Promise.all([
      db.user.findUnique({
        where: { email: sessionUser.email },
        include: { customer: true },
      }),
      db.paintColor.findUnique({ where: { code } }),
    ]);

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    if (!paintColor) return Response.json({ error: "Paint color not found" }, { status: 404 });

    const customer =
      user.customer ??
      (await db.customer.create({
        data: { userId: user.id },
      }));

    const existing = await db.wishlistColor.findUnique({
      where: {
        customerId_colorId: {
          customerId: customer.id,
          colorId: paintColor.id,
        },
      },
    });

    if (existing) {
      await db.wishlistColor.delete({ where: { id: existing.id } });
      return Response.json({ favorited: false, code });
    }

    await db.wishlistColor.create({
      data: {
        customerId: customer.id,
        colorId: paintColor.id,
      },
    });
    return Response.json({ favorited: true, code });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
