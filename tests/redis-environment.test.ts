import assert from "node:assert/strict";
import test from "node:test";
import {
  REDIS_ENVIRONMENT_REQUIREMENTS,
  resolveRedisEnvironment,
} from "../src/lib/redis-environment.ts";

test("prefers the Vercel Marketplace Redis environment pair", () => {
  assert.deepEqual(
    resolveRedisEnvironment({
      KV_REST_API_URL: " https://vercel-redis.example/ ",
      KV_REST_API_TOKEN: " vercel-token ",
      UPSTASH_REDIS_REST_URL: "https://direct-upstash.example",
      UPSTASH_REDIS_REST_TOKEN: "direct-token",
    }),
    {
      url: "https://vercel-redis.example/",
      token: "vercel-token",
      urlName: "KV_REST_API_URL",
      tokenName: "KV_REST_API_TOKEN",
    },
  );
});

test("supports the direct Upstash environment pair", () => {
  assert.deepEqual(
    resolveRedisEnvironment({
      UPSTASH_REDIS_REST_URL: "https://direct-upstash.example",
      UPSTASH_REDIS_REST_TOKEN: "direct-token",
    }),
    {
      url: "https://direct-upstash.example",
      token: "direct-token",
      urlName: "UPSTASH_REDIS_REST_URL",
      tokenName: "UPSTASH_REDIS_REST_TOKEN",
    },
  );
});

test("rejects incomplete or mixed Redis environment pairs", () => {
  assert.equal(
    resolveRedisEnvironment({
      KV_REST_API_URL: "https://vercel-redis.example",
    }),
    null,
  );
  assert.equal(
    resolveRedisEnvironment({
      KV_REST_API_URL: "https://vercel-redis.example",
      UPSTASH_REDIS_REST_TOKEN: "direct-token",
    }),
    null,
  );
});

test("documents both accepted Redis variable pairs without values", () => {
  assert.deepEqual(REDIS_ENVIRONMENT_REQUIREMENTS, [
    "KV_REST_API_URL or UPSTASH_REDIS_REST_URL",
    "KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN",
  ]);
});
