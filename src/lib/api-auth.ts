import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "@/lib/permissions";
import { PaginationError } from "@/lib/pagination";
import {
  createApiErrorResponse,
  getApiRequestId,
  type ApiErrorCode,
  type ApiErrorDescriptor,
} from "@/lib/api-error-contract";

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
    sessionId: session.user.sessionId,
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

function codeForStatus(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "TOO_MANY_REQUESTS";
  return "INTERNAL_ERROR";
}

function describeApiError(error: unknown): ApiErrorDescriptor {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: codeForStatus(error.status),
      message: error.message,
    };
  }
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return {
      status: 400,
      code: "BAD_REQUEST",
      message: "Dữ liệu gửi lên không hợp lệ",
    };
  }
  if (error instanceof PaginationError) {
    return { status: 400, code: "BAD_REQUEST", message: error.message };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        status: 409,
        code: "CONFLICT",
        message: "Dữ liệu đã tồn tại",
      };
    }
    if (error.code === "P2025") {
      return {
        status: 404,
        code: "NOT_FOUND",
        message: "Không tìm thấy dữ liệu",
      };
    }
    if (error.code === "P2003") {
      return {
        status: 409,
        code: "CONFLICT",
        message: "Dữ liệu đang được sử dụng",
      };
    }
  }

  console.error("Unhandled API error", {
    name: error instanceof Error ? error.name : typeof error,
  });
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Internal Server Error",
  };
}

export function apiErrorResponse(error: unknown, request?: Request) {
  const descriptor = describeApiError(error);
  return createApiErrorResponse(descriptor, getApiRequestId(request));
}
