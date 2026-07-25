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
  details?: unknown;
};

export function createApiErrorResponse(
  descriptor: ApiErrorDescriptor,
  requestId: string,
) {
  const response = Response.json(
    {
      error: {
        code: descriptor.code,
        message: descriptor.message,
        ...(descriptor.details === undefined
          ? {}
          : { details: sanitizeApiErrorDetails(descriptor.details) }),
      },
      requestId,
    },
    { status: descriptor.status },
  );
  response.headers.set("x-request-id", requestId);
  return response;
}

export function getApiRequestId(request?: Request) {
  return (
    request?.headers.get("x-request-id") ||
    request?.headers.get("x-vercel-id") ||
    crypto.randomUUID()
  );
}

const SENSITIVE_DETAIL_KEY =
  /(password|token|secret|authorization|credential|api[_-]?key|cookie)/i;

function sanitizeApiErrorDetails(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(sanitizeApiErrorDetails);
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_DETAIL_KEY.test(key) || entry === undefined) continue;
      output[key] = sanitizeApiErrorDetails(entry);
    }
    return output;
  }
  return String(value);
}

export function jsonApiError(
  request: Request,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
) {
  return createApiErrorResponse(
    { status, code, message, details },
    getApiRequestId(request),
  );
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
