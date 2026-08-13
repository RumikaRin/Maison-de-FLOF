import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { ApiError } from "@/lib/api-auth";
import { type CartLine, mergeCarts, normalizeCart } from "@/lib/cart-merge";

const cartLineSchema = z.object({
  paintId: z.string().trim().min(1).max(60),
  colorCode: z.string().trim().max(40).default(""),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const cartSnapshotSchema = z.object({
  items: z.array(cartLineSchema).max(100),
});

/** Hydrate stored lines into full cart items the client can render directly. */
async function hydrate(database: PrismaClient, userId: string) {
  const rows = await database.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      paint: {
        include: {
          category: { select: { name: true, nameEn: true } },
          supplier: { select: { name: true } },
        },
      },
    },
  });

  // Resolve colour records once for the codes actually in the cart.
  const codes = [...new Set(rows.map((r) => r.colorCode).filter(Boolean))];
  const colors = codes.length
    ? await database.paintColor.findMany({ where: { code: { in: codes } } })
    : [];
  const colorByCode = new Map(colors.map((c) => [c.code, c]));

  return rows.map((row) => ({
    id: row.colorCode ? `${row.paintId}-${row.colorCode}` : row.paintId,
    paint: row.paint,
    selectedColor: row.colorCode ? colorByCode.get(row.colorCode) ?? null : null,
    quantity: row.quantity,
  }));
}

/** Replace the whole server cart with a validated snapshot, atomically. */
async function writeSnapshot(
  database: PrismaClient,
  userId: string,
  lines: CartLine[],
) {
  const normalized = normalizeCart(lines);

  // Only keep lines whose paint still exists and is active — a stale local cart
  // must not resurrect a delisted product.
  const paintIds = [...new Set(normalized.map((l) => l.paintId))];
  const activePaints = paintIds.length
    ? await database.paint.findMany({
        where: { id: { in: paintIds }, isActive: true },
        select: { id: true },
      })
    : [];
  const activeIds = new Set(activePaints.map((p) => p.id));
  const clean = normalized.filter((l) => activeIds.has(l.paintId));

  await database.$transaction([
    database.cartItem.deleteMany({ where: { userId } }),
    ...(clean.length
      ? [
          database.cartItem.createMany({
            data: clean.map((l) => ({
              userId,
              paintId: l.paintId,
              colorCode: l.colorCode,
              quantity: l.quantity,
            })),
          }),
        ]
      : []),
  ]);
}

export async function getCart(database: PrismaClient, userId: string) {
  return hydrate(database, userId);
}

export async function replaceCart(
  database: PrismaClient,
  userId: string,
  input: unknown,
) {
  const parsed = cartSnapshotSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, "Giỏ hàng không hợp lệ");
  await writeSnapshot(database, userId, parsed.data.items);
  return hydrate(database, userId);
}

/** Sign-in merge: union the incoming local cart with what's already on the server. */
export async function mergeCart(
  database: PrismaClient,
  userId: string,
  input: unknown,
) {
  const parsed = cartSnapshotSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, "Giỏ hàng không hợp lệ");

  const existing = await database.cartItem.findMany({
    where: { userId },
    select: { paintId: true, colorCode: true, quantity: true },
  });

  const merged = mergeCarts(existing, parsed.data.items);
  await writeSnapshot(database, userId, merged);
  return hydrate(database, userId);
}
