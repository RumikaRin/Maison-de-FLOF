export class PaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaginationError";
  }
}

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

function parsePositiveInteger(
  rawValue: string | null,
  fallback: number,
  field: "page" | "limit",
) {
  if (rawValue === null) return fallback;
  if (!/^\d+$/.test(rawValue)) {
    throw new PaginationError(`${field} must be a positive integer`);
  }

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new PaginationError(`${field} must be a positive integer`);
  }
  return parsed;
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {},
) {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const page = parsePositiveInteger(pageParam, 1, "page");
  const limit = parsePositiveInteger(limitParam, defaultLimit, "limit");

  if (limit > maxLimit) {
    throw new PaginationError(`limit must not exceed ${maxLimit}`);
  }

  return {
    page,
    limit,
    requested: pageParam !== null || limitParam !== null,
  };
}
