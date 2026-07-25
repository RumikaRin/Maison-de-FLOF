type RuntimeEnvironment = "development" | "production" | "test";

export function buildContentSecurityPolicy(
  environment: RuntimeEnvironment,
  nonce?: string,
  options: { upgradeInsecureRequests?: boolean } = {},
) {
  const scriptSources = ["'self'"];
  if (nonce) scriptSources.push(`'nonce-${nonce}'`, "'strict-dynamic'");
  if (environment !== "production") {
    scriptSources.push("'unsafe-inline'", "'unsafe-eval'");
  }

  const directives = [
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
  ];
  if (options.upgradeInsecureRequests ?? environment === "production") {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}
