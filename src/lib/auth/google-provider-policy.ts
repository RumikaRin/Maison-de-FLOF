type Environment = Readonly<Record<string, string | undefined>>;

export function isGoogleProviderConfigured(environment: Environment): boolean {
  return Boolean(
    environment.GOOGLE_CLIENT_ID?.trim() &&
      environment.GOOGLE_CLIENT_SECRET?.trim(),
  );
}
