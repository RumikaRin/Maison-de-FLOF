import { isMainModule } from "./is-main-module.ts";

export const REQUIRED_PRODUCTION_VARIABLES = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "CRON_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

type Environment = Readonly<Record<string, string | undefined>>;

export function getMissingProductionVariables(environment: Environment) {
  return REQUIRED_PRODUCTION_VARIABLES.filter(
    (name) => !environment[name]?.trim(),
  );
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const missing = getMissingProductionVariables(process.env);

  if (missing.length === 0) {
    console.log("Production environment contract is complete.");
  } else {
    console.error(`Missing production variable names: ${missing.join(", ")}`);
    if (process.env.REQUIRE_PRODUCTION_ENV === "1") {
      process.exitCode = 1;
    }
  }
}
