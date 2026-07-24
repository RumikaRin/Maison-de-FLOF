import { Prisma } from "@prisma/client";

type OrderAccessUser = {
  email: string;
  role: string;
};

export function getOrderAccessWhere(
  user: OrderAccessUser,
  requestedEmail: string | null,
): Prisma.OrderWhereInput {
  const isStaff = user.role === "ADMIN" || user.role === "STAFF";

  if (isStaff && !requestedEmail) return {};

  return {
    customer: {
      user: {
        email: isStaff && requestedEmail ? requestedEmail : user.email,
      },
    },
  };
}
