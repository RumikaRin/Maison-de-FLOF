import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "@/lib/permissions";
import { PaginationError } from "@/lib/pagination";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { role: true },
  });
  if (!user) throw new ApiError(401, "Unauthorized");

  return {
    id: user.id,
    email: user.email,
    role: user.role.type,
  };
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new ApiError(403, "Forbidden");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (hasPermission(user.role, permission)) return user;
  throw new ApiError(403, "Forbidden");
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
  }
  if (error instanceof PaginationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json({ error: "Dữ liệu đã tồn tại" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return Response.json({ error: "Không tìm thấy dữ liệu" }, { status: 404 });
    }
    if (error.code === "P2003") {
      return Response.json({ error: "Dữ liệu đang được sử dụng" }, { status: 409 });
    }
  }

  console.error(error);
  return Response.json({ error: "Internal Server Error" }, { status: 500 });
}
