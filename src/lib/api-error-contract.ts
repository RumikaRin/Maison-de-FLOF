export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

export type ApiErrorDescriptor = {
  status: number;
  code: ApiErrorCode;
  message: string;
};

export function createApiErrorResponse(
  descriptor: ApiErrorDescriptor,
  requestId: string,
) {
  return Response.json(
    {
      error: {
        code: descriptor.code,
        message: descriptor.message,
        requestId,
      },
    },
    { status: descriptor.status },
  );
}

export function getApiRequestId(request?: Request) {
  return request?.headers.get("x-vercel-id") || crypto.randomUUID();
}

export function getApiErrorMessage(
  payload: unknown,
  fallback = "Request failed",
) {
  if (!payload || typeof payload !== "object") return fallback;

  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}
