type RuntimeEnvironment = "development" | "production" | "test";

export function buildContentSecurityPolicy(
  environment: RuntimeEnvironment,
) {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (environment !== "production") scriptSources.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com",
    "font-src 'self' data:",
    "connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
