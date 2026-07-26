import { isMainModule } from "./is-main-module.ts";
import {
  REDIS_ENVIRONMENT_REQUIREMENTS,
  resolveRedisEnvironment,
} from "../src/lib/redis-environment.ts";

export const REQUIRED_PRODUCTION_VARIABLES = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "AUTH_MFA_ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

type Environment = Readonly<Record<string, string | undefined>>;

export function getMissingProductionVariables(environment: Environment) {
  const missing: string[] = REQUIRED_PRODUCTION_VARIABLES.filter(
    (name) => !environment[name]?.trim(),
  );
  if (!resolveRedisEnvironment(environment)) {
    missing.push(...REDIS_ENVIRONMENT_REQUIREMENTS);
  }
  return missing;
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
