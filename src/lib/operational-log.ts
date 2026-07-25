type OperationalLogLevel = "info" | "error";
type OperationalLogRecord = {
  timestamp: string;
  event: string;
  [key: string]: unknown;
};

const SENSITIVE_OPERATIONAL_KEY =
  /(password|token|secret|authorization|credential|email|payload)/i;

const RAW_ERROR_KEYS = new Set(["error", "message", "stack", "raw"]);

function sanitizeOperationalValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map(sanitizeOperationalValue);
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      if (
        SENSITIVE_OPERATIONAL_KEY.test(key) ||
        RAW_ERROR_KEYS.has(normalizedKey)
      ) {
        continue;
      }
      if (entry !== undefined) {
        output[key] = sanitizeOperationalValue(entry);
      }
    }
    return output;
  }

  return String(value);
}

export function buildOperationalLog(
  event: string,
  fields: Record<string, unknown> = {},
): OperationalLogRecord {
  return {
    timestamp: new Date().toISOString(),
    event,
    ...(sanitizeOperationalValue(fields) as Record<string, unknown>),
  };
}

export function writeOperationalLog(
  level: OperationalLogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const serialized = JSON.stringify(buildOperationalLog(event, fields));
  if (level === "error") {
    console.error(serialized);
    return;
  }
  console.info(serialized);
}
