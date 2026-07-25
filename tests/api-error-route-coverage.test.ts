import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function findRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return findRouteFiles(absolute);
      return entry.name === "route.ts" ? [absolute] : [];
    }),
  );
  return nested.flat();
}

export async function findLegacyApiErrorResponses(
  apiRoot = path.resolve("src/app/api"),
) {
  const routeFiles = await findRouteFiles(apiRoot);
  const legacyPattern =
    /(?:NextResponse|Response)\.json\(\s*\{\s*error\s*:|JSON\.stringify\(\s*\{\s*error\s*:/g;
  const violations: string[] = [];

  for (const file of routeFiles) {
    const source = await readFile(file, "utf8");
    if (legacyPattern.test(source)) {
      violations.push(path.relative(process.cwd(), file).replaceAll("\\", "/"));
    }
    legacyPattern.lastIndex = 0;
  }

  return violations.sort();
}

test("all JSON API failures use the stable error envelope", async () => {
  const violations = await findLegacyApiErrorResponses();
  assert.deepEqual(violations, []);
});
