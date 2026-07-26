type Environment = Readonly<Record<string, string | undefined>>;

const REDIS_ENVIRONMENT_PAIRS = [
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
] as const;

export const REDIS_ENVIRONMENT_REQUIREMENTS = [
  "KV_REST_API_URL or UPSTASH_REDIS_REST_URL",
  "KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN",
] as const;

export function resolveRedisEnvironment(environment: Environment) {
  for (const [urlName, tokenName] of REDIS_ENVIRONMENT_PAIRS) {
    const url = environment[urlName]?.trim();
    const token = environment[tokenName]?.trim();
    if (url && token) {
      return { url, token, urlName, tokenName };
    }
  }

  return null;
}
