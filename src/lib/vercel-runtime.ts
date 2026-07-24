export function shouldEnableVercelTelemetry(
  environment: { VERCEL?: string },
) {
  return environment.VERCEL === "1";
}
