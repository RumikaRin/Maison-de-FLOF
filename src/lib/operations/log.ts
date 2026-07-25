type OperationalLogSeverity = "info" | "warn" | "error";

export type OperationalLogRecord = {
  timestamp: string;
  event: string;
  severity: OperationalLogSeverity;
  correlationId: string;
  [key: string]: unknown;
};

const SENSITIVE_OPERATIONAL_KEY =
  /(password|token|secret|authorization|credential|email|phone|address|payload|requestBody|cookie)/i;

const RAW_ERROR_KEYS = new Set([
  "error",
  "message",
  "stack",
  "raw",
  "cause",
  "response",
]);

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

  if (Array.isArray(value)) return value.map(sanitizeOperationalValue);

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (
        SENSITIVE_OPERATIONAL_KEY.test(key) ||
        RAW_ERROR_KEYS.has(key.toLowerCase())
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
  severity: OperationalLogSeverity,
  event: string,
  fields: Record<string, unknown> = {},
): OperationalLogRecord {
  const sanitized = sanitizeOperationalValue(fields) as Record<string, unknown>;
  return {
    timestamp: new Date().toISOString(),
    event,
    severity,
    correlationId:
      typeof sanitized.correlationId === "string"
        ? sanitized.correlationId
        : crypto.randomUUID(),
    ...sanitized,
  };
}

export function writeOperationalLog(
  severity: OperationalLogSeverity,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const serialized = JSON.stringify(
    buildOperationalLog(severity, event, fields),
  );
  if (severity === "error") {
    console.error(serialized);
  } else if (severity === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}
